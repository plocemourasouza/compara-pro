/** @vitest-environment jsdom */

import { within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@/test/react";
import { ComparisonDesk } from "./comparison-desk";

describe("comparação ilustrativa da landing", () => {
	it("organiza o pré-pedido por fornecedor e permite fechar a demonstração", () => {
		render(<ComparisonDesk />);
		const trigger = screen.getByRole("button", { name: "Ver pré-pedido" });
		fireEvent.click(trigger);
		const dialog = screen.getByRole("dialog", { name: "Seu pré-pedido." });
		expect(
			within(dialog).getByRole("heading", {
				name: /Distribuidora Norte.*632,32/,
			}),
		).toBeInTheDocument();
		expect(
			within(dialog).getByRole("heading", { name: /Atacado Sul.*485,30/ }),
		).toBeInTheDocument();
		expect(within(dialog).getByText(/R\$\s*1\.117,62/)).toBeInTheDocument();
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Fechar pré-pedido" }),
		);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it("recalcula por quantidade e impede um pré-pedido sem itens", () => {
		render(<ComparisonDesk />);
		expect(screen.getByText(/R\$\s*1\.117,62/)).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("checkbox", { name: "Selecionar Arroz branco tipo 1" }),
		);
		expect(screen.getByText(/R\$\s*669,62/)).toBeInTheDocument();
		fireEvent.click(
			screen.getByRole("checkbox", {
				name: "Selecionar todos os itens visíveis",
			}),
		);
		fireEvent.click(
			screen.getByRole("checkbox", {
				name: "Selecionar todos os itens visíveis",
			}),
		);
		expect(screen.getByText(/R\$\s*0,00/)).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: "Ver pré-pedido" }),
		).toBeDisabled();
	});

	it("filtra a lista sem perder a seleção e aceita busca sem acento", () => {
		render(<ComparisonDesk />);
		fireEvent.click(screen.getByRole("button", { name: "Limpeza" }));
		const table = screen.getByRole("table");
		expect(
			within(table).getByText("Detergente líquido neutro"),
		).toBeInTheDocument();
		expect(
			within(table).queryByText("Arroz branco tipo 1"),
		).not.toBeInTheDocument();
		expect(screen.getByText(/R\$\s*1\.117,62/)).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: /Todos os itens/ }));
		fireEvent.change(
			screen.getByRole("searchbox", { name: "Buscar item na demonstração" }),
			{ target: { value: "cafe" } },
		);
		expect(within(table).getByText("Café torrado e moído")).toBeInTheDocument();
		fireEvent.change(
			screen.getByRole("searchbox", { name: "Buscar item na demonstração" }),
			{ target: { value: "inexistente" } },
		);
		expect(
			within(table).getByText(/Nenhum item encontrado/),
		).toBeInTheDocument();
	});
});
