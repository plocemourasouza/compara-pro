import { execSync } from "node:child_process";
import { expect, type Page, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

/**
 * Fluxo profundo comprador→representante pela UI — o "E2E profundo" do
 * backlog. `business-flow.spec.ts` já cobre esse caminho superficialmente
 * (o gap antes coberto só por scripts/verify-cycle.cjs no nível de API), e
 * `compare-manual-parecer.spec.ts` já cobre o parecer aparecendo na tela e o
 * override manual de fornecedor confirmando um pré-pedido — este teste NÃO
 * repete essas asserções.
 *
 * O que este teste soma, que nenhum dos dois cobre:
 *  - o parecer é conferido contra os FATOS reais da comparação via API
 *    (não só "o texto aparece na tela"), provando que o motor determinístico
 *    (parecer-facts.ts) rodou sobre os dados certos (Beta mais barato nos 3
 *    itens, XYZ-99 sem match);
 *  - o override manual é exercitado de forma REVERSÍVEL: aplica e desfaz,
 *    provando que o agrupamento por fornecedor recalcula de verdade
 *    (1 pré-pedido → 2 → 1 de novo) sem deixar um segundo pré-pedido para
 *    trás quando a escolha volta ao fornecedor mais barato;
 *  - o pré-pedido é identificado pelo ID devolvido pela própria chamada de
 *    criação (não "a primeira linha Pendente" — há outros testes nesta
 *    suíte criando pré-pedidos para o mesmo comprador);
 *  - a troca de sessão localiza esse pré-pedido específico pela busca da
 *    lista (ref = últimos 8 chars do id — o mesmo texto exibido na UI);
 *  - o status final (FINALIZED) é confirmado por uma leitura de API
 *    pós-aprovação, não assumido a partir do toast.
 *
 * Limpeza: a comparação + matches + pré-pedido criados aqui não têm
 * varredura em scripts/cleanup-e2e.cjs (que só cobre a empresa/usuário
 * órfãos de supplier-clients.spec.ts). Como os IDs são conhecidos e
 * exclusivos desta execução, a limpeza é feita por ID exato no `finally`
 * abaixo, sem tocar em nenhum dado semeado.
 */

const DB_CONTAINER = "price-comparison-db";
const DB_USER = "myuser";
const DB_NAME = "price_comparison";

/** Lê "Suas escolhas geram N pré-pedido(s), agrupados por fornecedor." e devolve N. */
async function readGroupCount(page: Page): Promise<number> {
	const text = await page
		.getByText(/suas escolhas geram \d+ pré-pedido/i)
		.innerText();
	const raw = text.match(/(\d+)\s*pré-pedido/i)?.[1];
	if (!raw) {
		throw new Error(
			`não foi possível ler o contador de agrupamento em: "${text}"`,
		);
	}
	return Number(raw);
}

/** Remove, por ID exato, a comparação e o pré-pedido criados por este teste. */
function cleanupById(comparisonId: string, preOrderId: string): void {
	if (!comparisonId && !preOrderId) return;

	const statements = [
		preOrderId
			? `DELETE FROM notifications WHERE metadata::text LIKE '%${preOrderId}%';`
			: "",
		preOrderId
			? `DELETE FROM pre_order_items WHERE "preOrderId" = '${preOrderId}';`
			: "",
		preOrderId ? `DELETE FROM pre_orders WHERE id = '${preOrderId}';` : "",
		comparisonId
			? `DELETE FROM supplier_matches WHERE "comparisonMatchId" IN (SELECT id FROM comparison_matches WHERE "comparisonId" = '${comparisonId}');`
			: "",
		comparisonId
			? `DELETE FROM comparison_matches WHERE "comparisonId" = '${comparisonId}';`
			: "",
		comparisonId ? `DELETE FROM comparisons WHERE id = '${comparisonId}';` : "",
	].filter((s) => s.length > 0);

	try {
		execSync(
			`docker exec -i ${DB_CONTAINER} psql -U ${DB_USER} -d ${DB_NAME} -v ON_ERROR_STOP=1`,
			{ input: statements.join("\n") },
		);
		console.log(
			`E2E_CLEANUP_OK business-flow-deep comparisonId=${comparisonId} preOrderId=${preOrderId}`,
		);
	} catch (err) {
		// Um teardown nunca deve derrubar o teste — falha aqui é apenas logada.
		console.log(
			`E2E_CLEANUP_ERR business-flow-deep ${err instanceof Error ? err.message : String(err)}`,
		);
	}
}

test.describe
	.serial("fluxo profundo comprador→representante (UI, ponta-a-ponta)", () => {
		test("comprador compara, parecer bate com os fatos, pré-pedido identificado por ID e status final verificado por API", async ({
			browser,
		}) => {
			let comparisonId = "";
			let preOrderId = "";

			const buyerCtx = await browser.newContext();
			const repCtx = await browser.newContext();
			const buyerErrors: string[] = [];
			const repErrors: string[] = [];

			try {
				// ───────── comprador: compara, confere o parecer, cria o pré-pedido ─────────
				const buyer = await buyerCtx.newPage();
				buyer.on("pageerror", (e) => buyerErrors.push(e.message));

				await loginAs(buyer, "comprador@demo.com");
				await buyer.goto("/client/compare");

				await buyer.getByRole("combobox").first().click();
				await buyer.getByRole("option").first().click();

				const compareResponse = buyer.waitForResponse(
					(r) =>
						r.url().includes("/api/comparison/create") &&
						r.request().method() === "POST",
				);
				await buyer.getByRole("button", { name: /comparar preços/i }).click();
				const compareJson = (await (await compareResponse).json()) as {
					comparisonId?: string;
				};
				comparisonId = compareJson.comparisonId ?? "";
				expect(
					comparisonId,
					"a criação da comparação deve devolver um ID",
				).not.toBe("");

				await expect(buyer.getByText(/resultados da comparação/i)).toBeVisible({
					timeout: 30_000,
				});
				await expect(buyer.getByText(/parecer da operação/i)).toBeVisible({
					timeout: 30_000,
				});

				// O parecer é conferido contra os fatos reais da comparação (dados
				// semeados: Parafuso M6 / Caneta Azul / Papel A4 batem em Alfa e
				// Beta, Beta sempre mais barato; XYZ-99 não tem match).
				const parecerRes = await buyer.request.get(
					`/api/comparison/${comparisonId}/parecer`,
				);
				expect(
					parecerRes.ok(),
					"GET do parecer deve responder 200",
				).toBeTruthy();
				const { parecer } = (await parecerRes.json()) as {
					parecer: {
						totais: {
							totalProdutos: number;
							produtosComMatch: number;
							produtosSemMatch: number;
							fornecedorMaisVantajoso: { nome: string; itens: number } | null;
						};
						oportunidades: { fornecedorRecomendado: string }[];
						geradoEm: string;
					};
				};
				expect(parecer.totais.totalProdutos).toBe(4);
				expect(parecer.totais.produtosComMatch).toBe(3);
				expect(parecer.totais.produtosSemMatch).toBe(1);
				expect(parecer.totais.fornecedorMaisVantajoso?.nome).toBe(
					"Fornecedor Beta",
				);
				expect(parecer.oportunidades).toHaveLength(3);
				for (const o of parecer.oportunidades) {
					expect(o.fornecedorRecomendado).toBe("Fornecedor Beta");
				}
				expect(Date.now() - new Date(parecer.geradoEm).getTime()).toBeLessThan(
					5 * 60_000,
				);

				// Override manual (reversível): o combobox de fornecedor do último
				// item alterna para Alfa — o agrupamento vai a 2 pré-pedidos — e
				// volta para Beta, provando que o override recalcula de verdade
				// sem deixar um segundo pré-pedido órfão quando revertido.
				const groupsSummary = buyer.getByText(
					/suas escolhas geram \d+ pré-pedido/i,
				);
				await expect(groupsSummary).toBeVisible({ timeout: 15_000 });
				await expect.poll(() => readGroupCount(buyer)).toBe(1);

				const combos = buyer.getByRole("combobox");
				const supplierSelect = combos.nth((await combos.count()) - 1);
				await supplierSelect.scrollIntoViewIfNeeded();
				await supplierSelect.click();
				await buyer.getByRole("option", { name: "Fornecedor Alfa" }).click();
				await expect.poll(() => readGroupCount(buyer)).toBe(2);

				await supplierSelect.click();
				await buyer.getByRole("option", { name: "Fornecedor Beta" }).click();
				await expect.poll(() => readGroupCount(buyer)).toBe(1);

				// Confirmar pré-pedido — captura o ID da própria resposta da API
				// (o valor que controlamos), não "a primeira linha" depois.
				const createBatchResponse = buyer.waitForResponse(
					(r) =>
						r.url().includes("/api/pre-order/create-batch") &&
						r.request().method() === "POST",
				);
				await buyer
					.getByRole("button", { name: /confirmar pré-pedido/i })
					.click();
				const batchJson = (await (await createBatchResponse).json()) as {
					success?: boolean;
					preOrderIds?: string[];
				};
				expect(batchJson.success).toBe(true);
				expect(
					batchJson.preOrderIds,
					"o override revertido deve gerar um único pré-pedido (Beta)",
				).toHaveLength(1);
				preOrderId = batchJson.preOrderIds?.[0] ?? "";
				expect(preOrderId).not.toBe("");

				await expect(buyer.getByText(/pré-pedido/i).first()).toBeVisible({
					timeout: 15_000,
				});

				// Estado real pós-criação, não assumido pelo toast.
				const createdDetail = await buyer.request.get(
					`/api/pre-order/${preOrderId}`,
				);
				expect(createdDetail.ok()).toBeTruthy();
				const { preOrder: createdPreOrder } = (await createdDetail.json()) as {
					preOrder: {
						status: string;
						supplier: { name: string };
						itemCount: number;
					};
				};
				expect(createdPreOrder.status).toBe("ACTIVE");
				expect(createdPreOrder.supplier.name).toBe("Fornecedor Beta");
				expect(createdPreOrder.itemCount).toBe(3);

				expect(buyerErrors, buyerErrors.join("\n")).toEqual([]);

				// ───────── representante: localiza ESSE pré-pedido, aprova, confirma o status final ─────────
				const rep = await repCtx.newPage();
				rep.on("pageerror", (e) => repErrors.push(e.message));

				await loginAs(rep, "representante@demo.com");
				await rep.goto("/supplier/pre-orders");
				await expect(
					rep.getByRole("heading", { level: 1, name: /pré-pedidos/i }),
				).toBeVisible({ timeout: 15_000 });

				const ref = preOrderId.slice(-8);
				await rep.getByPlaceholder("Buscar por cliente ou nº...").fill(ref);

				const rows = rep.locator("tbody tr");
				await expect(rows).toHaveCount(1, { timeout: 15_000 });
				await expect(rows.first()).toContainText("Pendente");
				await expect(rows.first()).toContainText("Comprador Demo");
				await rows.first().click();

				await rep.waitForURL(`**/supplier/pre-orders/${preOrderId}`, {
					timeout: 15_000,
				});
				await expect(
					rep.getByRole("heading", { level: 1, name: `Pré-pedido #${ref}` }),
				).toBeVisible();
				await expect(rep.getByText("Parafuso M6")).toBeVisible({
					timeout: 10_000,
				});

				const approveResponse = rep.waitForResponse(
					(r) =>
						r.url().includes("/api/pre-order/bulk-action") &&
						r.request().method() === "POST",
				);
				await rep.getByRole("button", { name: /aprovar/i }).click();
				const approveJson = (await (await approveResponse).json()) as {
					message?: string;
					updatedCount?: number;
				};
				expect(approveJson.updatedCount).toBe(1);
				expect(approveJson.message ?? "").toMatch(/aprovad/i);

				await expect(rep.getByText(/aprovad/i).first()).toBeVisible({
					timeout: 15_000,
				});

				// Status final verificado por API depois da navegação de volta —
				// não assumido a partir do toast.
				const finalDetail = await rep.request.get(
					`/api/pre-order/${preOrderId}`,
				);
				expect(finalDetail.ok()).toBeTruthy();
				const { preOrder: finalPreOrder } = (await finalDetail.json()) as {
					preOrder: { status: string; respondedAt: string | null };
				};
				expect(finalPreOrder.status).toBe("FINALIZED");
				expect(finalPreOrder.respondedAt).not.toBeNull();

				expect(repErrors, repErrors.join("\n")).toEqual([]);
			} finally {
				await buyerCtx.close();
				await repCtx.close();
				cleanupById(comparisonId, preOrderId);
			}
		});
	});
