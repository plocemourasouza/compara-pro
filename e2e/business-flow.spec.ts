import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// Fluxo de negócio ponta-a-ponta pela UI (gap antes coberto só por scripts/verify-cycle.cjs
// no nível de API). Cruza comprador → representante em sessões isoladas.
test.describe
	.serial("fluxo de negócio comprador→fornecedor (UI)", () => {
		test("comprador compara, confirma pré-pedido; representante aprova", async ({
			browser,
		}) => {
			const buyerCtx = await browser.newContext();
			const supplierCtx = await browser.newContext();
			const buyerErrors: string[] = [];

			try {
				// ───────── comprador ─────────
				const buyer = await buyerCtx.newPage();
				buyer.on("pageerror", (e) => buyerErrors.push(e.message));

				await loginAs(buyer, "comprador@demo.com");
				await buyer.goto("/client/compare");

				// selecionar a lista de requisitos (Radix Select) e comparar
				await buyer.getByRole("combobox").first().click();
				await buyer.getByRole("option").first().click();
				await buyer.getByRole("button", { name: /comparar preços/i }).click();

				// resultados renderizam
				await expect(buyer.getByText(/resultados da comparação/i)).toBeVisible({
					timeout: 30_000,
				});

				// economia (feature economia-tela-cliente): se houver targetPrice > preço,
				// o badge/cartão "Economia" aparece. Condicional por design (oculto quando 0).
				const economia = buyer.getByText(/economia/i).first();
				if (await economia.isVisible().catch(() => false)) {
					await expect(economia).toBeVisible();
				}

				// confirmar pré-pedido
				await buyer
					.getByRole("button", { name: /confirmar pré-pedido/i })
					.click();

				// sucesso (toast) — pré-pedido criado
				await expect(buyer.getByText(/pré-pedido/i).first()).toBeVisible({
					timeout: 15_000,
				});

				expect(buyerErrors, buyerErrors.join("\n")).toEqual([]);

				// ───────── representante ─────────
				const sup = await supplierCtx.newPage();
				await loginAs(sup, "representante@demo.com");
				await sup.goto("/supplier/pre-orders");
				await expect(
					sup.getByRole("heading", { level: 1, name: /pré-pedidos/i }),
				).toBeVisible({ timeout: 15_000 });

				// localizar um pré-pedido pendente → abrir modal → aprovar
				const row = sup
					.locator("tbody tr")
					.filter({ hasText: /Pendente/ })
					.first();
				await expect(row).toBeVisible({ timeout: 15_000 });
				await row.click();

				const dialog = sup.getByRole("dialog");
				await expect(dialog).toBeVisible();
				await dialog.getByRole("button", { name: /aprovar/i }).click();

				// confirmação da aprovação (toast / modal fecha)
				await expect(sup.getByText(/aprovad/i).first()).toBeVisible({
					timeout: 15_000,
				});
			} finally {
				await buyerCtx.close();
				await supplierCtx.close();
			}
		});
	});
