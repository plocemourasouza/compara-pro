import { expect, test } from "@playwright/test";

// Fase 3 — listas read-only/ação: clicar na linha abre a modal de detalhe.
//
// admin/history foi redesenhado (commit 3bd4d15, "Listas de Preço") para uma
// visão de listas de preço: título "Listas de Preço" e coluna Status agora
// mostra Ativo/Inativo (isActive) em vez do status bruto de processamento
// (Concluído/Falhou/Processando/Cancelado), que só volta a aparecer dentro
// da modal de detalhe. Os seletores abaixo foram atualizados para o DOM atual.
test.describe("admin/history — padrão lista → detalhe", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/auth/login");
		await page.fill('input[name="email"]', "admin@demo.com");
		await page.fill('input[name="password"]', "demo1234");
		await page.getByRole("button", { name: /entrar/i }).click();
		await page.waitForURL("**/admin", { timeout: 20_000 });
	});

	test("linha abre modal de detalhe do upload e fecha com Esc", async ({
		page,
	}) => {
		await page.goto("/admin/history");
		await expect(
			page.getByRole("heading", { level: 1, name: /listas de preço/i }),
		).toBeVisible({ timeout: 15_000 });

		// Aguarda os dados (badge de status numa linha real).
		await expect(
			page
				.locator("tbody tr")
				.filter({ hasText: /Ativo|Inativo/ })
				.first(),
		).toBeVisible({ timeout: 15_000 });

		await page
			.locator("tbody tr")
			.filter({ hasText: /Ativo|Inativo/ })
			.first()
			.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText("Detalhes do Upload")).toBeVisible();

		await page.keyboard.press("Escape");
		await expect(dialog).toBeHidden();
	});
});
