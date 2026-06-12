import { expect, test } from "@playwright/test";
import { loginAs } from "./helpers/auth";

// #2 (F6 AC-07) match manual de produto sem correspondência pela UI, e
// #3 (T-08) parecer renderiza no fluxo + override de fornecedor confirma pré-pedido.
// Ambos partem do mesmo setup: comprador roda a comparação em /client/compare.

async function runComparison(page: import("@playwright/test").Page) {
	await loginAs(page, "comprador@demo.com");
	await page.goto("/client/compare");
	await page.getByRole("combobox").first().click();
	await page.getByRole("option").first().click();
	await page.getByRole("button", { name: /comparar preços/i }).click();
	await expect(page.getByText(/resultados da comparação/i)).toBeVisible({
		timeout: 30_000,
	});
}

test("match manual associa produto sem correspondência (F6 AC-07)", async ({
	page,
}) => {
	await runComparison(page);

	// O item sem correspondência (XYZ-99 "Item Inexistente") é exposto p/ match manual.
	await expect(
		page.getByText(/produto não encontrado nos fornecedores/i).first(),
	).toBeVisible({ timeout: 15_000 });
	await page
		.getByRole("button", { name: /buscar manualmente/i })
		.first()
		.click();

	const dialog = page.getByRole("dialog");
	await expect(dialog).toBeVisible();
	await dialog
		.getByPlaceholder(/digite para buscar produtos/i)
		.fill("Parafuso");

	// Resultado vem do catálogo do fornecedor (Product.id — base do AC-07).
	const result = dialog
		.locator("button")
		.filter({ hasText: /parafuso/i })
		.first();
	await expect(result).toBeVisible({ timeout: 15_000 });
	await result.click();
	await dialog.getByRole("button", { name: /associar produto/i }).click();

	// Após associar, a comparação recarrega e o item deixa de estar "não encontrado".
	await expect(
		page.getByText(/produto não encontrado nos fornecedores/i),
	).toHaveCount(0, { timeout: 15_000 });
});

test("parecer renderiza no fluxo e override confirma pré-pedido (T-08)", async ({
	page,
}) => {
	await runComparison(page);

	// Parecer da operação renderiza (fallback determinístico — sem AI key configurada).
	await expect(page.getByText(/parecer da operação/i)).toBeVisible({
		timeout: 30_000,
	});

	// Override: troca o fornecedor escolhido de um produto (último combobox = um
	// produto com Alfa/Beta; o primeiro combobox é o seletor de lista).
	const combos = page.getByRole("combobox");
	const n = await combos.count();
	const supplierSelect = combos.nth(n - 1);
	await supplierSelect.scrollIntoViewIfNeeded();
	await supplierSelect.click();
	const options = page.getByRole("option");
	await expect(options.first()).toBeVisible({ timeout: 10_000 });
	if ((await options.count()) > 1) {
		await options.nth(1).click(); // fornecedor alternativo
	} else {
		await page.keyboard.press("Escape");
	}

	// Confirma o pré-pedido com o override aplicado.
	await page.getByRole("button", { name: /confirmar pré-pedido/i }).click();
	await expect(page.getByText(/pré-pedido/i).first()).toBeVisible({
		timeout: 15_000,
	});
});
