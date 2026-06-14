import { expect, test } from "@playwright/test";

// Todas as telas do admin. O objetivo é pegar "HTTP 200 mas crasha no render"
// (ex.: Radix <SelectItem value="">): num crash de render o Next troca a página
// pelo overlay de erro e o <h1> some — então a asserção do heading fica vermelha.
const ADMIN_PAGES = [
	"/admin",
	"/admin/representatives",
	"/admin/representatives/novo",
	"/admin/users",
	"/admin/companies",
	"/admin/products",
	"/admin/pre-orders",
	"/admin/history",
	"/admin/reports",
	"/admin/settings",
];

test.describe("admin — telas renderizam sem crash de runtime", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "admin@demo.com");
		await page.fill('input[name="password"]', "demo1234");
		await page.getByRole("button", { name: /entrar/i }).click();
		await page.waitForURL("**/admin", { timeout: 20_000 });
	});

	for (const path of ADMIN_PAGES) {
		test(`${path} abre sem erro`, async ({ page }) => {
			const errors: string[] = [];
			page.on("pageerror", (e) => errors.push(e.message));

			await page.goto(path);
			await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible(
				{ timeout: 15_000 },
			);

			expect(errors, errors.join("\n")).toHaveLength(0);
		});
	}
});
