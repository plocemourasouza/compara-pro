import { expect, test } from "@playwright/test";

// Valida os proxies de consulta usados no cadastro de empresa:
// CNPJ (CNPJÁ open) e CEP (BrasilAPI). Exigem sessão de ADMIN.
test.describe("lookup empresa (CNPJ + CEP)", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "admin@demo.com");
		await page.fill('input[name="password"]', "demo1234");
		await page.getByRole("button", { name: /entrar/i }).click();
		await page.waitForURL("**/admin", { timeout: 20_000 });
	});

	test("CEP retorna endereço normalizado", async ({ page }) => {
		const res = await page.request.get("/api/lookup/cep/01310100");
		expect(res.ok()).toBeTruthy();
		const data = await res.json();
		expect(data.city).toBe("São Paulo");
		expect(data.state).toBe("SP");
		expect(data.street).toContain("Paulista");
	});

	test("CNPJ retorna dados normalizados", async ({ page }) => {
		const res = await page.request.get("/api/lookup/cnpj/00000000000191");
		expect(res.ok()).toBeTruthy();
		const data = await res.json();
		expect(data.legalName).toContain("BANCO DO BRASIL");
		expect(data.address?.state).toBe("DF");
	});

	test("formulário preenche endereço ao digitar o CEP", async ({ page }) => {
		await page.goto("/admin/companies/novo");
		await expect(
			page.getByRole("heading", { level: 1, name: /cadastrar nova empresa/i }),
		).toBeVisible({ timeout: 15_000 });

		await page.getByLabel("CEP *").fill("01310100");
		// Autofill via /api/lookup/cep → preenche cidade/estado/logradouro.
		await expect(page.getByLabel("Cidade *")).toHaveValue("São Paulo", {
			timeout: 15_000,
		});
		await expect(page.getByLabel("Bairro *")).toHaveValue("Bela Vista");
	});

	test("lookup exige autenticação", async ({ browser }) => {
		const anon = await browser.newContext();
		const res = await anon.request.get("/api/lookup/cep/01310100", {
			baseURL: "http://localhost:3000",
		});
		expect(res.status()).toBe(401);
		await anon.close();
	});
});
