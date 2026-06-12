import { expect, test } from "@playwright/test";

// Regressão: a modal de detalhe do histórico carrega para o admin (admin sem
// empresa deve ver o detalhe de qualquer upload).
test("admin carrega detalhe do upload sem erro", async ({ page }) => {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "admin@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/admin", { timeout: 20_000 });

	await page.goto("/admin/history");
	const row = page
		.locator("tbody tr")
		.filter({ hasText: /Concluído|Falhou|Processando|Cancelado/ })
		.first();
	await expect(row).toBeVisible({ timeout: 15_000 });
	await row.click();

	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	// Detalhe carregou: mostra "Estatísticas" e NÃO a mensagem de erro.
	await expect(
		dialog.getByRole("heading", { name: "Estatísticas" }),
	).toBeVisible({
		timeout: 10_000,
	});
	await expect(
		dialog.getByText(/Não foi possível carregar os detalhes/),
	).toHaveCount(0);
});

// F6: o detalhe de um upload de FORNECEDOR (catalogo.xlsx) lê os produtos do
// catálogo `products` (por lastUploadId), não mais do staging UploadedProduct.
test("admin vê produtos no detalhe de um upload de fornecedor (catálogo)", async ({
	page,
}) => {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "admin@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/admin", { timeout: 20_000 });

	await page.goto("/admin/history");
	// upload de fornecedor = arquivo "catalogo.xlsx" concluído
	const row = page
		.locator("tbody tr")
		.filter({ hasText: /catalogo\.xlsx/i })
		.filter({ hasText: /Concluído/ })
		.first();
	await expect(row).toBeVisible({ timeout: 15_000 });
	await row.click();

	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	await expect(
		dialog.getByRole("heading", { name: "Estatísticas" }),
	).toBeVisible({ timeout: 10_000 });
	// Produtos do catálogo aparecem (≥1 linha com nome de produto).
	await expect(
		dialog.getByText(/Parafuso|Caneta|Papel|Toner|Luva/i).first(),
	).toBeVisible({
		timeout: 10_000,
	});
	await expect(
		dialog.getByText(/Não foi possível carregar os detalhes/),
	).toHaveCount(0);
});
