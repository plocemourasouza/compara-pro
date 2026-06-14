import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// Verifica os ajustes da lista de Representantes:
// - colunas removidas (Tipo, Responsável) e adicionadas (Pré-pedidos, Status)
// - CNPJ anonimizado (LGPD): nunca exibe os 14 dígitos completos; cópia disponível
test.describe("admin — lista de representantes", () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page, "admin@demo.com");
		await page.goto("/admin/representatives");
		await expect(
			page.getByRole("columnheader", { name: "Empresa" }),
		).toBeVisible({ timeout: 15_000 });
	});

	test("colunas: +Pré-pedidos +Status, -Tipo -Responsável", async ({
		page,
	}) => {
		await expect(
			page.getByRole("columnheader", { name: "Pré-pedidos" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "Status" }),
		).toBeVisible();
		await expect(
			page.getByRole("columnheader", { name: "Tipo", exact: true }),
		).toHaveCount(0);
		await expect(
			page.getByRole("columnheader", { name: "Responsável" }),
		).toHaveCount(0);
	});

	test("CNPJ anonimizado: nenhum CNPJ completo visível", async ({ page }) => {
		// Nenhum texto na página pode bater o padrão de CNPJ completo formatado.
		await expect(
			page.getByText(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/),
		).toHaveCount(0);
	});

	test("lista carrega dados (sem erro 500)", async ({ page }) => {
		// Garante que o fetch de fato popula a tabela — headers renderizam mesmo em
		// falha, então sem esta checagem um 500 passaria despercebido.
		await expect(page.getByText(/Erro ao carregar/i)).toHaveCount(0);
		// header + ao menos uma linha de dados (seed tem representantes).
		expect(await page.getByRole("row").count()).toBeGreaterThan(1);
	});
});
