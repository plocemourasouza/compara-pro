import { expect, test } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "admin@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/admin", { timeout: 20_000 });
}

// Fase 2 — o padrão (linha → modal de detalhe → Editar → rota dedicada) nas
// demais listas de cadastro: admin/users, admin/products, supplier/products.
test.describe("cadastros — padrão lista → detalhe → editar", () => {
	test("admin/users: linha abre detalhe e Editar vai para rota dedicada", async ({
		page,
	}) => {
		await loginAdmin(page);
		await page.goto("/admin/users");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
			timeout: 15_000,
		});

		await expect(
			page
				.locator(
					'tbody button[aria-label="Desativar usuário"], tbody button[aria-label="Reativar usuário"]',
				)
				.first(),
		).toBeVisible({ timeout: 15_000 });
		const firstRow = page.locator("tbody tr").first();
		await firstRow.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText("Detalhes do Usuário")).toBeVisible();

		await dialog.getByRole("button", { name: /editar/i }).click();
		await page.waitForURL(/\/admin\/users\/.+\/editar/, { timeout: 15_000 });
		await expect(
			page.getByRole("heading", { level: 1, name: /editar usuário/i }),
		).toBeVisible();
	});

	test("admin/users: Novo Usuário vai para a rota de cadastro", async ({
		page,
	}) => {
		await loginAdmin(page);
		await page.goto("/admin/users");
		await page.getByRole("button", { name: /novo usuário/i }).click();
		await page.waitForURL("**/admin/users/novo", { timeout: 15_000 });
		await expect(
			page.getByRole("heading", { level: 1, name: /criar novo usuário/i }),
		).toBeVisible();
	});

	test("admin/products: linha abre detalhe e Editar vai para rota dedicada", async ({
		page,
	}) => {
		await loginAdmin(page);
		await page.goto("/admin/products");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
			timeout: 15_000,
		});

		await expect(
			page.locator('tbody button[aria-label="Excluir produto"]').first(),
		).toBeVisible({ timeout: 15_000 });
		const firstRow = page.locator("tbody tr").first();
		await firstRow.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText("Detalhes do Produto")).toBeVisible();

		await dialog.getByRole("button", { name: /editar/i }).click();
		await page.waitForURL(/\/admin\/products\/.+\/editar/, { timeout: 15_000 });
		await expect(
			page.getByRole("heading", { level: 1, name: /editar produto/i }),
		).toBeVisible();
	});

	test("supplier/products: linha abre detalhe e Editar vai para rota dedicada", async ({
		page,
	}) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "representante@demo.com");
		await page.fill('input[name="password"]', "demo1234");
		await page.getByRole("button", { name: /entrar/i }).click();
		await page.waitForURL("**/supplier", { timeout: 20_000 });

		await page.goto("/supplier/products");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
			timeout: 15_000,
		});

		await expect(
			page.locator('tbody button[aria-label="Excluir produto"]').first(),
		).toBeVisible({ timeout: 15_000 });
		const firstRow = page.locator("tbody tr").first();
		await firstRow.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText("Detalhes do Produto")).toBeVisible();

		await dialog.getByRole("button", { name: /editar/i }).click();
		await page.waitForURL(/\/supplier\/products\/.+\/editar/, {
			timeout: 15_000,
		});
		await expect(
			page.getByRole("heading", { level: 1, name: /editar produto/i }),
		).toBeVisible();
	});
});
