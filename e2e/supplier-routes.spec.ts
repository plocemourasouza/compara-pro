import { expect, test } from "@playwright/test";

// Smoke: todas as rotas do fornecedor renderizam (sem 404 / sem erro de runtime).
const ROUTES = [
	"/supplier",
	"/supplier/upload",
	"/supplier/products",
	"/supplier/clients",
	"/supplier/pre-orders",
	"/supplier/history",
	"/supplier/notifications",
	"/supplier/settings",
];

test("rotas do fornecedor renderizam sem erro", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));

	await page.goto("/auth/login");
	await page.fill('input[name="email"]', "fornecedor.alfa@demo.com");
	await page.fill('input[name="password"]', "demo1234");
	await page.getByRole("button", { name: /entrar/i }).click();
	await page.waitForURL("**/supplier", { timeout: 20_000 });

	for (const route of ROUTES) {
		await page.goto(route);
		// Layout do fornecedor renderizou (não redirecionou / não 404).
		await expect(page.getByText("Painel Fornecedor")).toBeVisible({
			timeout: 15_000,
		});
		await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}$`));
	}

	expect(errors, errors.join("\n")).toEqual([]);
});
