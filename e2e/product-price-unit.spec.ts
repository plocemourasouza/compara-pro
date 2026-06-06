import { expect, test } from "@playwright/test";

// Preço em formato de moeda + Unidade como combobox (valor em maiúsculo) no
// cadastro de produtos.
test("editar produto mostra preço em moeda e unidade em maiúsculo", async ({
	page,
}) => {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "admin@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/admin", { timeout: 20_000 });

	await page.goto("/admin/products");
	await expect(
		page.locator('tbody button[aria-label="Excluir produto"]').first(),
	).toBeVisible({ timeout: 15_000 });

	await page.locator("tbody tr").first().click();
	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	await dialog.getByRole("button", { name: /editar/i }).click();
	await page.waitForURL(/\/admin\/products\/.+\/editar/, { timeout: 15_000 });

	// Preço como moeda BR (ex.: "0,50").
	await expect(page.getByLabel("Preço")).toHaveValue(/^\d{1,3}(\.\d{3})*,\d{2}$/);
	// Unidade: combobox com o código em maiúsculo (seed "un" -> "UN — UNIDADE").
	await expect(
		page.getByRole("combobox").filter({ hasText: /\s—\s/ }),
	).toHaveText(/^[A-Z0-9]+ — [A-ZÀ-Ú ]+$/);
});
