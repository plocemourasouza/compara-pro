import { describe, expect, it } from "vitest";
import {
	computeParecerFacts,
	fallbackNarrative,
	type ParecerMatchInput,
} from "./parecer-facts";

const matches: ParecerMatchInput[] = [
	{
		clientProduct: { name: "Parafuso M6" },
		bestPrice: 0.45,
		supplierMatches: [
			{ price: 0.45, supplierCompany: { name: "Beta" } },
			{ price: 0.5, supplierCompany: { name: "Alfa" } },
		],
	},
	{
		clientProduct: { name: "Caneta Azul" },
		bestPrice: 1.2,
		supplierMatches: [
			{ price: 1.2, supplierCompany: { name: "Beta" } },
			{ price: 1.5, supplierCompany: { name: "Alfa" } },
		],
	},
	{
		clientProduct: { name: "Papel A4" },
		bestPrice: 18.5,
		supplierMatches: [
			{ price: 18.5, supplierCompany: { name: "Beta" } },
			{ price: 20, supplierCompany: { name: "Alfa" } },
		],
	},
	{
		clientProduct: { name: "Item Inexistente" },
		bestPrice: null,
		supplierMatches: [],
	},
];

const totals = {
	totalProducts: 4,
	matchedProducts: 3,
	unmatchedProducts: 1,
	bestPriceTotal: 20.15,
};

describe("computeParecerFacts", () => {
	it("orders opportunities by unit savings (desc)", () => {
		const f = computeParecerFacts(matches, totals);
		// savings: Papel 1.5, Caneta 0.3, Parafuso 0.05
		expect(f.oportunidades.map((o) => o.produto)).toEqual([
			"Papel A4",
			"Caneta Azul",
			"Parafuso M6",
		]);
	});

	it("computes total estimated savings and best supplier", () => {
		const f = computeParecerFacts(matches, totals);
		expect(f.totais.economiaEstimada).toBeCloseTo(1.85, 2);
		expect(f.totais.fornecedorMaisVantajoso).toEqual({
			nome: "Beta",
			itens: 3,
		});
		expect(f.totais.produtosSemMatch).toBe(1);
		expect(f.totais.totalMelhorPreco).toBe(20.15);
	});

	it("excludes unmatched products from opportunities", () => {
		const f = computeParecerFacts(matches, totals);
		expect(f.oportunidades).toHaveLength(3);
		expect(f.oportunidades.some((o) => o.produto === "Item Inexistente")).toBe(
			false,
		);
	});

	it("handles an empty comparison without throwing", () => {
		const f = computeParecerFacts([], {
			totalProducts: 0,
			matchedProducts: 0,
			unmatchedProducts: 0,
			bestPriceTotal: null,
		});
		expect(f.oportunidades).toHaveLength(0);
		expect(f.totais.economiaEstimada).toBe(0);
		expect(f.totais.fornecedorMaisVantajoso).toBeNull();
	});
});

describe("fallbackNarrative", () => {
	it("produces a populated resumo and vantagens with no AI", () => {
		const f = computeParecerFacts(matches, totals);
		const n = fallbackNarrative(f);
		expect(n.resumo.length).toBeGreaterThan(20);
		expect(n.vantagens.length).toBeGreaterThanOrEqual(3);
		expect(n.resumo).toContain("Beta");
	});
});
