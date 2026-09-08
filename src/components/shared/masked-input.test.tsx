/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@/test/react";
import { MaskedInput } from "./masked-input";

describe("MaskedInput", () => {
	describe("branch falsy de value", () => {
		it('value="" → renderiza vazio', () => {
			render(<MaskedInput mask="cnpj" value="" onChange={() => {}} />);
			expect(screen.getByRole("textbox")).toHaveValue("");
		});

		it("value={undefined} → renderiza vazio, não a string 'undefined'", () => {
			render(<MaskedInput mask="cnpj" value={undefined} onChange={() => {}} />);
			const input = screen.getByRole("textbox");
			expect(input).toHaveValue("");
			expect(input).not.toHaveValue("undefined");
		});
	});

	it("remascara dígitos crus vindos do banco (cnpj)", () => {
		render(
			<MaskedInput mask="cnpj" value="11222333000181" onChange={() => {}} />,
		);
		expect(screen.getByRole("textbox")).toHaveValue("11.222.333/0001-81");
	});

	it("idempotência: valor já mascarado renderiza inalterado", () => {
		render(
			<MaskedInput
				mask="cnpj"
				value="11.222.333/0001-81"
				onChange={() => {}}
			/>,
		);
		expect(screen.getByRole("textbox")).toHaveValue("11.222.333/0001-81");
	});

	it("onChange recebe o valor já mascarado (contrato react-hook-form), não o evento", () => {
		const onChange = vi.fn();
		render(<MaskedInput mask="cnpj" value="" onChange={onChange} />);
		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "11222333000181" } });
		expect(onChange).toHaveBeenCalledWith("11.222.333/0001-81");
	});

	describe("inputMode ?? 'numeric'", () => {
		it("sem inputMode explícito → default numeric", () => {
			render(<MaskedInput mask="cnpj" value="" onChange={() => {}} />);
			expect(screen.getByRole("textbox")).toHaveAttribute(
				"inputMode",
				"numeric",
			);
		});

		it("inputMode explícito vence o default", () => {
			render(
				<MaskedInput
					mask="cnpj"
					value=""
					onChange={() => {}}
					inputMode="text"
				/>,
			);
			expect(screen.getByRole("textbox")).toHaveAttribute("inputMode", "text");
		});
	});

	it("overflow: CNPJ com 15 dígitos excede a máscara e volta cru, sem truncar", () => {
		// Comportamento atual de masks.cnpj: quando `cleaned.length > 14` a função
		// devolve o `value` original sem aplicar nenhuma formatação (nem trunca).
		render(
			<MaskedInput mask="cnpj" value="112223330001811" onChange={() => {}} />,
		);
		expect(screen.getByRole("textbox")).toHaveValue("112223330001811");
	});
});
