import { describe, expect, it } from "vitest";
import { createOrderCsv, DEMO_PRODUCTS } from "./comparison-data";

describe("CSV do pré-pedido ilustrativo", () => {
	it("exporta só os itens escolhidos, com fornecedor e subtotal em português", () => {
		const csv = createOrderCsv(
			DEMO_PRODUCTS.filter((p) => p.id === 1 || p.id === 2),
		);
		expect(csv.startsWith("\uFEFF")).toBe(true);
		expect(csv).toContain(
			'"Arroz branco tipo 1";"Pacote 5 kg";"20";"pct.";"Norte";"22,40";"448,00"',
		);
		expect(csv).toContain(
			'"Feijão carioca";"Pacote 1 kg";"30";"pct.";"Sul";"6,49";"194,70"',
		);
		expect(csv).not.toContain("Óleo de soja");
		expect(csv.split("\r\n")).toHaveLength(4);
	});
});
