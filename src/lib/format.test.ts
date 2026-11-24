import { describe, expect, it } from "vitest";
import { formatImportedPrice } from "./format";

describe("formatImportedPrice", () => {
	it("formats a raw spreadsheet number as reais", () => {
		expect(formatImportedPrice(26)).toBe("R$\u00a026,00");
		expect(formatImportedPrice(100)).toBe("R$\u00a0100,00");
	});

	it("formats a pt-BR amount written in the cell", () => {
		expect(formatImportedPrice("12,50")).toBe("R$\u00a012,50");
		expect(formatImportedPrice("1.234,56")).toBe("R$\u00a01.234,56");
	});

	it("leaves column names and product text untouched", () => {
		expect(formatImportedPrice("Preço")).toBe("Preço");
		expect(formatImportedPrice("137 (coluna 4)")).toBe("137 (coluna 4)");
		expect(formatImportedPrice("")).toBe("");
	});
});
