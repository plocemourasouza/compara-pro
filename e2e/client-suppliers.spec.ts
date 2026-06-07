import { expect, test } from "@playwright/test";

// Carteira do lado cliente (Meus Fornecedores) + solicitação vista pelo representante.
// Estado de seed: comprador vinculado à Alfa E Beta; solicitação pendente da
// "Loja Demo" p/ Beta (vista pelo representante que representa Beta).

test("cliente vê os fornecedores vinculados", async ({ page }) => {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "comprador@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/client", { timeout: 20_000 });

	await page.goto("/client/suppliers");
	await expect(
		page.getByRole("heading", { name: "Meus Fornecedores" }),
	).toBeVisible({ timeout: 15_000 });

	// Vinculados: Alfa e Beta.
	await expect(page.getByText("Vinculados")).toBeVisible();
	await expect(page.getByText("Fornecedor Alfa")).toBeVisible({
		timeout: 15_000,
	});
	await expect(page.getByText("Fornecedor Beta")).toBeVisible();
});

test("representante vê a solicitação pendente do cliente", async ({ page }) => {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "representante@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/supplier", { timeout: 20_000 });

	await page.goto("/supplier/clients");
	await expect(page.getByText("Solicitações pendentes")).toBeVisible({
		timeout: 15_000,
	});
	await expect(page.getByText("Loja Demo")).toBeVisible();
	await expect(
		page.getByRole("button", { name: /aprovar/i }).first(),
	).toBeVisible();
});
