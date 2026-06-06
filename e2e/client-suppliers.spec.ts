import { expect, test } from "@playwright/test";

// Carteira do lado cliente (Meus Fornecedores) + solicitação vista pelo fornecedor.
// Estado de seed: comprador vinculado à Alfa; solicitação pendente p/ Beta.

test("cliente vê fornecedor vinculado e solicitação pendente", async ({
	page,
}) => {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "comprador@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/client", { timeout: 20_000 });

	await page.goto("/client/suppliers");
	await expect(
		page.getByRole("heading", { name: "Meus Fornecedores" }),
	).toBeVisible({ timeout: 15_000 });

	// Vinculado: Alfa.
	await expect(page.getByText("Vinculados")).toBeVisible();
	await expect(page.getByText("Fornecedor Alfa")).toBeVisible({
		timeout: 15_000,
	});
	// Pendente: Beta.
	await expect(page.getByText("Aguardando aprovação")).toBeVisible();
	await expect(page.getByText("Fornecedor Beta")).toBeVisible();
});

test("fornecedor vê a solicitação pendente do cliente", async ({ page }) => {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "fornecedor.beta@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/supplier", { timeout: 20_000 });

	await page.goto("/supplier/clients");
	await expect(page.getByText("Solicitações pendentes")).toBeVisible({
		timeout: 15_000,
	});
	await expect(page.getByText("Comprador Demo")).toBeVisible();
	await expect(
		page.getByRole("button", { name: /aprovar/i }).first(),
	).toBeVisible();
});
