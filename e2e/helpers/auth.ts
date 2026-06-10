import type { Page } from "@playwright/test";

export type DemoEmail =
	| "comprador@demo.com"
	| "representante@demo.com"
	| "admin@demo.com";

/** Painel esperado após login, por papel. */
const PANEL_URL: Record<DemoEmail, string> = {
	"comprador@demo.com": "**/client",
	"representante@demo.com": "**/supplier",
	"admin@demo.com": "**/admin",
};

/**
 * Login pela UI (form de /auth/login) e espera o painel do papel carregar.
 * Reutilizável entre specs — evita duplicar o bloco de login.
 */
export async function loginAs(
	page: Page,
	email: DemoEmail,
	password = "demo1234",
): Promise<void> {
	await page.goto("/auth/login");
	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', password);
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL(PANEL_URL[email], { timeout: 20_000 });
}
