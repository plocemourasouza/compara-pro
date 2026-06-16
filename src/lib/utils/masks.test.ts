import { describe, expect, it } from "vitest";
import { formatters } from "./masks";

describe("formatters.redactCnpj (anonimização null-safe)", () => {
	it("mascara CNPJ válido (14 dígitos)", () => {
		expect(formatters.redactCnpj("11222333000181")).toBe("11.222.***/****-**");
	});

	it("mascara CNPJ já formatado", () => {
		expect(formatters.redactCnpj("11.222.333/0001-81")).toBe(
			"11.222.***/****-**",
		);
	});

	it("null/undefined/vazio → null (sem '***')", () => {
		expect(formatters.redactCnpj(null)).toBeNull();
		expect(formatters.redactCnpj(undefined)).toBeNull();
		expect(formatters.redactCnpj("")).toBeNull();
	});

	it("string não-vazia inválida → '***' (não vaza dígitos)", () => {
		expect(formatters.redactCnpj("123")).toBe("***");
	});
});
