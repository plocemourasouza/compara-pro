import { expect, test } from "@playwright/test";

async function loginAlfa(page: import("@playwright/test").Page) {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "representante@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/supplier", { timeout: 20_000 });
}

test("carteira lista o cliente e gera indicações do catálogo", async ({
	page,
}) => {
	await loginAlfa(page);

	await page.goto("/supplier/clients");
	const row = page.locator("tbody tr").filter({ hasText: "Comprador Demo" });
	await expect(row).toBeVisible({ timeout: 15_000 });
	await row.click();

	// Detalhe do cliente → demandas → ver indicações.
	await expect(page.getByText("Listas de demanda")).toBeVisible();
	await page
		.getByRole("button", { name: /ver indicações/i })
		.first()
		.click();

	await page.waitForURL(/\/indicacoes\//, { timeout: 15_000 });
	await expect(page.getByRole("heading", { name: "Indicações" })).toBeVisible({
		timeout: 20_000,
	});
	await expect(page.getByText("Cobertura")).toBeVisible();
	await expect(page.getByText("Produtos que você atende")).toBeVisible();
	// O catálogo da alfa casa com a demanda → ao menos um item atendido.
	await expect(page.locator("table tbody tr").first()).toBeVisible();
});

test("adicionar cliente gera código de primeiro acesso", async ({ page }) => {
	await loginAlfa(page);
	await page.goto("/supplier/clients/novo");

	const stamp = `${Date.now()}`;
	// Escolhe o fornecedor de destino (representante representa Alfa e Beta).
	await page.getByRole("combobox").first().click();
	await page.getByRole("option", { name: "Fornecedor Alfa" }).click();
	await page.getByLabel("Nome da Empresa *").fill(`Cliente E2E ${stamp}`);
	await page.getByLabel("Nome do Contato *").fill("Contato E2E");
	await page
		.getByLabel("E-mail do Contato *")
		.fill(`cliente.e2e.${stamp}@demo.com`);
	await page
		.getByRole("button", { name: "Adicionar cliente", exact: true })
		.click();

	await expect(
		page.getByText("Código de primeiro acesso", { exact: true }),
	).toBeVisible({ timeout: 15_000 });
	await expect(page.locator("p.font-mono")).toHaveText(/^\d{6}$/);
});
