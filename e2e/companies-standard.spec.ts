import { expect, test } from "@playwright/test";

// Valida o padrão de comportamento das listas em admin/companies (referência):
// click na linha → modal de detalhe → Editar navega para rota dedicada;
// Esc/Fechar fecham a modal; "Nova Empresa" navega para /novo.
test.describe("admin/companies — padrão lista → detalhe → editar", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "admin@demo.com");
		await page.fill('input[name="password"]', "demo1234");
		await page.getByRole("button", { name: /entrar/i }).click();
		await page.waitForURL("**/admin", { timeout: 20_000 });
		await page.goto("/admin/companies");
		await expect(
			page.getByRole("heading", { level: 1, name: /empresas/i }),
		).toBeVisible({ timeout: 15_000 });
		// Aguarda os dados carregarem (linha real tem o botão de excluir).
		await expect(
			page.locator('tbody tr button[aria-label="Excluir empresa"]').first(),
		).toBeVisible({ timeout: 15_000 });
	});

	test("click na linha abre modal de detalhe e fecha com Esc", async ({
		page,
	}) => {
		const firstRow = page.locator("tbody tr").first();
		await firstRow.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText("Detalhes da Empresa")).toBeVisible();

		await page.keyboard.press("Escape");
		await expect(dialog).toBeHidden();
	});

	test("Editar na modal navega para a rota dedicada de edição", async ({
		page,
	}) => {
		await page.locator("tbody tr").first().click();
		await expect(page.getByRole("dialog")).toBeVisible();

		await page
			.getByRole("dialog")
			.getByRole("button", { name: /editar/i })
			.click();

		await page.waitForURL(/\/admin\/companies\/.+\/editar/, {
			timeout: 15_000,
		});
		await expect(
			page.getByRole("heading", { level: 1, name: /editar empresa/i }),
		).toBeVisible();
	});

	test("Nova Empresa navega para a rota de cadastro", async ({ page }) => {
		await page.getByRole("button", { name: /nova empresa/i }).click();
		await page.waitForURL("**/admin/companies/novo", { timeout: 15_000 });
		await expect(
			page.getByRole("heading", { level: 1, name: /cadastrar nova empresa/i }),
		).toBeVisible();
	});
});
