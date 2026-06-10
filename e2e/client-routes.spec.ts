import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// Smoke: todas as rotas do cliente renderizam (sem 404 / sem erro de runtime).
const ROUTES = [
	"/client",
	"/client/upload",
	"/client/compare",
	"/client/suppliers",
	"/client/pre-orders",
	"/client/history",
	"/client/notifications",
	"/client/settings",
];

test("rotas do cliente renderizam sem erro", async ({ page }) => {
	const errors: string[] = [];
	page.on("pageerror", (e) => errors.push(e.message));

	await loginAs(page, "comprador@demo.com");

	for (const route of ROUTES) {
		await page.goto(route);
		await expect(page.getByText("Painel Cliente")).toBeVisible({
			timeout: 15_000,
		});
		await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, "\\/")}$`));
	}

	expect(errors, errors.join("\n")).toEqual([]);
});
