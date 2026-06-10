import { describe, expect, it } from "vitest";
import {
	calcItemSavings,
	calcTotalSavings,
	type SavingsMatch,
	type SavingsSelection,
} from "./savings";

describe("calcItemSavings", () => {
	it("AC-03: economia = (targetPrice − chosenPrice) × quantity", () => {
		expect(calcItemSavings(10, 8, 3)).toBe(6);
	});

	it("AC-04: targetPrice null → 0 (sem economia)", () => {
		expect(calcItemSavings(null, 8, 3)).toBe(0);
		expect(calcItemSavings(undefined, 8, 3)).toBe(0);
	});

	it("AC-05: preço escolhido ≥ alvo → 0, nunca negativo", () => {
		expect(calcItemSavings(8, 8, 3)).toBe(0);
		expect(calcItemSavings(8, 10, 3)).toBe(0);
	});

	it("chosenPrice null → 0 (sem fornecedor escolhido)", () => {
		expect(calcItemSavings(10, null, 3)).toBe(0);
		expect(calcItemSavings(10, undefined, 3)).toBe(0);
	});

	it("quantity zero → 0", () => {
		expect(calcItemSavings(10, 8, 0)).toBe(0);
	});
});

function match(
	id: string,
	targetPrice: number | null,
	suppliers: Array<{ id: string; price: number }>,
): SavingsMatch {
	return {
		id,
		clientProduct: { targetPrice },
		supplierMatches: suppliers.map((s) => ({
			supplier: { id: s.id },
			price: s.price,
		})),
	};
}

describe("calcTotalSavings", () => {
	const matches: SavingsMatch[] = [
		match("m1", 10, [
			{ id: "supA", price: 8 },
			{ id: "supB", price: 9 },
		]),
		match("m2", 10, [{ id: "supA", price: 6 }]),
		match("m3", null, [{ id: "supA", price: 5 }]),
	];

	it("AC-06: soma das economias dos itens incluídos", () => {
		// m1: (10−8)×3 = 6 ; m2: (10−6)×1 = 4 ; m3: targetPrice null → 0
		const selections: Record<string, SavingsSelection> = {
			m1: { included: true, supplierId: "supA", quantity: 3 },
			m2: { included: true, supplierId: "supA", quantity: 1 },
			m3: { included: true, supplierId: "supA", quantity: 2 },
		};
		expect(calcTotalSavings(matches, selections)).toBe(10);
	});

	it("AC-09: item desmarcado (included=false) sai do total", () => {
		const selections: Record<string, SavingsSelection> = {
			m1: { included: false, supplierId: "supA", quantity: 3 },
			m2: { included: true, supplierId: "supA", quantity: 1 },
		};
		expect(calcTotalSavings(matches, selections)).toBe(4);
	});

	it("usa o preço do fornecedor escolhido (AC-08 base)", () => {
		const selections: Record<string, SavingsSelection> = {
			m1: { included: true, supplierId: "supB", quantity: 3 }, // (10−9)×3 = 3
		};
		expect(calcTotalSavings(matches, selections)).toBe(3);
	});

	it("sem fornecedor escolhido → não soma", () => {
		const selections: Record<string, SavingsSelection> = {
			m1: { included: true, supplierId: "", quantity: 3 },
		};
		expect(calcTotalSavings(matches, selections)).toBe(0);
	});

	it("nenhuma economia → 0 (base p/ AC-07 ocultar total)", () => {
		const onlyNull: SavingsMatch[] = [
			match("x", null, [{ id: "s", price: 5 }]),
		];
		const selections: Record<string, SavingsSelection> = {
			x: { included: true, supplierId: "s", quantity: 9 },
		};
		expect(calcTotalSavings(onlyNull, selections)).toBe(0);
	});

	it("AC-10: paridade com a fórmula do admin (Σ max(0, base − preço) × qtd)", () => {
		// oráculo: replica savings.finalizedSavings do dashboard admin
		const selections: Record<string, SavingsSelection> = {
			m1: { included: true, supplierId: "supA", quantity: 3 },
			m2: { included: true, supplierId: "supA", quantity: 2 },
			m3: { included: true, supplierId: "supA", quantity: 4 },
		};
		const adminOracle = matches.reduce((sum, m) => {
			const sel = selections[m.id];
			if (!sel?.included || !sel.supplierId) return sum;
			const chosen = m.supplierMatches.find(
				(s) => s.supplier.id === sel.supplierId,
			);
			const base = m.clientProduct.targetPrice;
			if (base == null || !chosen) return sum;
			return sum + Math.max(0, base - chosen.price) * sel.quantity;
		}, 0);

		expect(calcTotalSavings(matches, selections)).toBe(adminOracle);
	});
});
