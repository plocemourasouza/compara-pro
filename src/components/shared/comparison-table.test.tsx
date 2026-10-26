/** @vitest-environment jsdom */

import { within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/react";
import { ComparisonTable, type ComparisonTableRow } from "./comparison-table";

const suppliers = [
	{ id: "alfa", name: "Fornecedor Alfa" },
	{ id: "beta", name: "Fornecedor Beta" },
];

const rows: ComparisonTableRow[] = [
	{
		id: "parafuso",
		name: "Parafuso M6",
		meta: "SKU PAR-M6",
		quantity: 4,
		included: true,
		offers: [
			{ supplierId: "alfa", price: 0.6 },
			{ supplierId: "beta", price: 0.45 },
		],
		bestPrice: 0.45,
		selectedSupplierId: "alfa",
		unmatched: false,
	},
	{
		id: "caneta",
		name: "Caneta Azul",
		quantity: 1,
		included: true,
		offers: [{ supplierId: "alfa", price: 1.2 }],
		bestPrice: 1.2,
		selectedSupplierId: "alfa",
		unmatched: false,
	},
];

describe("mesa de comparação", () => {
	it("marca só o menor preço, nomeia o vencedor e mostra travessão sem oferta", () => {
		render(
			<ComparisonTable
				suppliers={suppliers}
				rows={rows}
				onToggleIncluded={vi.fn()}
				onQuantityChange={vi.fn()}
				onSelectSupplier={vi.fn()}
			/>,
		);

		const beta = screen.getByRole("button", {
			name: /menor preço de Fornecedor Beta/,
		});
		expect(beta).toHaveClass("bg-success/10", "text-success");
		expect(beta).toHaveTextContent("Menor preço");

		const alfa = screen.getByRole("button", {
			name: /R\$\s*0,60 de Fornecedor Alfa, oferta escolhida/,
		});
		expect(alfa).not.toHaveTextContent("Menor preço");
		expect(alfa).toHaveClass("ring-primary");
		expect(alfa).not.toHaveClass("bg-success/10");

		const parafuso = screen.getByRole("row", { name: /Parafuso M6/ });
		expect(within(parafuso).getByText("Fornecedor Beta")).toBeInTheDocument();
		expect(
			screen.getByText("Sem oferta de Fornecedor Beta"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Verde = menor preço da linha."),
		).toBeInTheDocument();
	});

	it("escolhe outra oferta ao clicar na célula", () => {
		const onSelectSupplier = vi.fn();
		render(
			<ComparisonTable
				suppliers={suppliers}
				rows={rows}
				onToggleIncluded={vi.fn()}
				onQuantityChange={vi.fn()}
				onSelectSupplier={onSelectSupplier}
			/>,
		);

		fireEvent.click(
			screen.getByRole("button", {
				name: /menor preço de Fornecedor Beta/,
			}),
		);
		expect(onSelectSupplier).toHaveBeenCalledWith("parafuso", "beta");
	});
});
