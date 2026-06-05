import { expect, test } from "@playwright/test";

test.describe("autenticação", () => {
	test("rejeita credenciais inválidas", async ({ page }) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "nao@existe.com");
		await page.fill('input[name="password"]', "senhaerrada");
		await page.getByRole("button", { name: /entrar/i }).click();
		await expect(page.getByText("Credenciais inválidas")).toBeVisible();
		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test("loga o comprador e chega na área do cliente", async ({ page }) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "comprador@demo.com");
		await page.fill('input[name="password"]', "demo1234");
		await page.getByRole("button", { name: /entrar/i }).click();
		await page.waitForURL("**/client", { timeout: 20_000 });
		await expect(page).toHaveURL(/\/client/);
	});

	test("redireciona acesso não autenticado para o login", async ({ page }) => {
		await page.goto("/client");
		await page.waitForURL(/\/auth\/login/, { timeout: 20_000 });
		await expect(page).toHaveURL(/\/auth\/login/);
	});
});
