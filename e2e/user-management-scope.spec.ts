import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// Gestão de usuários por sessão (representante/cliente) + autoatendimento.
// Cobre a relocação (admin nas sessões) e — o ponto crítico — as invariantes de
// autorização do autoatendimento via API real (escalonamento/cross-tenant).

test.describe("relocação: admin gerencia nas sessões", () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page, "admin@demo.com");
	});

	test("admin abre /supplier/usuarios (representantes)", async ({ page }) => {
		await page.goto("/supplier/usuarios");
		await expect(
			page.getByRole("heading", { level: 1, name: "Usuários" }),
		).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByRole("button", { name: /novo usuário/i }),
		).toBeVisible();
	});

	test("admin abre /client/usuarios (clientes)", async ({ page }) => {
		await page.goto("/client/usuarios");
		await expect(
			page.getByRole("heading", { level: 1, name: "Usuários" }),
		).toBeVisible({ timeout: 15_000 });
	});
});

test.describe("autoatendimento do representante", () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page, "representante@demo.com");
	});

	test("form de novo não expõe escolha de papel (implícito)", async ({
		page,
	}) => {
		await page.goto("/supplier/usuarios/novo");
		const papel = page.getByLabel("Papel");
		await expect(papel).toBeVisible({ timeout: 15_000 });
		await expect(papel).toHaveValue("Representante");
		await expect(papel).toBeDisabled();
	});

	test("não pode criar ADMIN (escalonamento bloqueado)", async ({ page }) => {
		const res = await page.request.post("/api/users?scopeRole=REPRESENTATIVE", {
			data: {
				name: "Hacker",
				email: "hacker@example.com",
				phone: "(11) 90000-0000",
				role: "ADMIN",
			},
		});
		expect(res.status()).toBe(403);
	});

	test("não pode listar clientes de outra área (forbidden)", async ({
		page,
	}) => {
		const res = await page.request.get("/api/users?scopeRole=CLIENT");
		expect(res.status()).toBe(403);
	});

	test("listagem própria só traz representantes", async ({ page }) => {
		const res = await page.request.get("/api/users?scopeRole=REPRESENTATIVE");
		expect(res.ok()).toBeTruthy();
		const data = await res.json();
		expect(Array.isArray(data.users)).toBeTruthy();
		for (const u of data.users) {
			expect(u.role).toBe("REPRESENTATIVE");
		}
	});

	test("não alcança a sessão do cliente (redirect)", async ({ page }) => {
		await page.goto("/client/usuarios");
		await expect(page).toHaveURL(/\/supplier(\/|$)/, { timeout: 15_000 });
	});
});

test.describe("autoatendimento do cliente", () => {
	test.beforeEach(async ({ page }) => {
		await loginAs(page, "comprador@demo.com");
	});

	test("não pode criar fora do próprio papel/empresa", async ({ page }) => {
		// Tenta criar um representante a partir da sessão do cliente.
		const res = await page.request.post("/api/users?scopeRole=REPRESENTATIVE", {
			data: {
				name: "Intruso",
				email: "intruso@example.com",
				phone: "(11) 90000-0000",
				role: "REPRESENTATIVE",
			},
		});
		expect(res.status()).toBe(403);
	});

	test("não alcança a sessão do representante (redirect)", async ({ page }) => {
		await page.goto("/supplier/usuarios");
		await expect(page).toHaveURL(/\/client(\/|$)/, { timeout: 15_000 });
	});
});
