import { expect, test } from "@playwright/test";

// Fase 3 + detalhe com itens: pré-pedidos abrem modal de detalhe com a tabela
// de itens; supplier vê Aprovar/Rejeitar (ACTIVE); admin é read-only.
test.describe("pre-orders — lista → detalhe (itens) → ação", () => {
	test("supplier: linha abre modal com itens e ações Aprovar/Rejeitar", async ({
		page,
	}) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "representante@demo.com");
		await page.fill('input[name="password"]', "demo1234");
		await page.getByRole("button", { name: /entrar/i }).click();
		await page.waitForURL("**/supplier", { timeout: 20_000 });

		await page.goto("/supplier/pre-orders");
		await expect(
			page.getByRole("heading", { level: 1, name: /pré-pedidos/i }),
		).toBeVisible({ timeout: 15_000 });

		const row = page
			.locator("tbody tr")
			.filter({ hasText: /Pendente/ })
			.first();
		await expect(row).toBeVisible({ timeout: 15_000 });
		await row.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText(/Pré-pedido #/)).toBeVisible();
		// Tabela de itens carrega via /api/pre-order/[id] (nome do produto).
		await expect(dialog.getByText("Parafuso M6")).toBeVisible({
			timeout: 10_000,
		});
		await expect(
			dialog.getByRole("button", { name: /aprovar/i }),
		).toBeVisible();
	});

	test("admin: lista mostra pré-pedidos e modal é read-only", async ({
		page,
	}) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "admin@demo.com");
		await page.fill('input[name="password"]', "demo1234");
		await page.getByRole("button", { name: /entrar/i }).click();
		await page.waitForURL("**/admin", { timeout: 20_000 });

		await page.goto("/admin/pre-orders");
		const row = page
			.locator("tbody tr")
			.filter({ hasText: /Pendente/ })
			.first();
		await expect(row).toBeVisible({ timeout: 15_000 });
		await row.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText(/Pré-pedido #/)).toBeVisible();
		await expect(dialog.getByRole("button", { name: /aprovar/i })).toHaveCount(
			0,
		);
	});
});
