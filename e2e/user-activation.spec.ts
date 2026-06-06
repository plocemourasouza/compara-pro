import { expect, test } from "@playwright/test";

// Fluxo de gestão de usuários: admin cria sem senha → usuário ativa no
// primeiro acesso com o código (mostrado ao admin neste ambiente sem e-mail).
test("admin cria usuário e usuário ativa no primeiro acesso", async ({
	page,
}) => {
	// Login admin
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "admin@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/admin", { timeout: 20_000 });

	// Criar usuário (sem senha; com telefone)
	const email = `e2e-${Date.now()}@demo.com`;
	await page.goto("/admin/users/novo");
	await expect(
		page.getByRole("heading", { level: 1, name: /criar novo usuário/i }),
	).toBeVisible({ timeout: 15_000 });

	await page.getByLabel("Nome Completo *").fill("Usuário E2E");
	await page.getByLabel("Email *").fill(email);
	await page.getByLabel("Telefone *").fill("11999998888");
	await page.getByLabel("Nome da Empresa *").fill("Empresa E2E Ativação");
	await page.getByRole("button", { name: /criar usuário/i }).click();

	// O código aparece no toast (ambiente sem RESEND configurado).
	const codeText = await page
		.getByText(/Código de primeiro acesso: \d{6}/)
		.first()
		.textContent({ timeout: 15_000 });
	const code = codeText?.match(/(\d{6})/)?.[1];
	expect(code).toBeTruthy();

	// Primeiro acesso: confirmar código + definir senha
	await page.goto("/auth/primeiro-acesso");
	await page.getByLabel("Email").fill(email);
	await page
		.locator('input[autocomplete="one-time-code"]')
		.fill(code as string);
	await page.getByLabel("Nova senha").fill("novasenha123");
	await page.getByLabel("Confirmar senha").fill("novasenha123");
	await page.getByRole("button", { name: /ativar conta/i }).click();

	// Ativou → login automático → dashboard do cliente
	await page.waitForURL("**/client", { timeout: 20_000 });
});
