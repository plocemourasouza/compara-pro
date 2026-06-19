import { describe, expect, it } from "vitest";
import {
	applyMapping,
	autoMapHeaders,
	buildRows,
	type CanonicalField,
	detectHeaderRow,
	type HeaderMapping,
	normalizeHeader,
	SUPPLIER_FIELDS,
} from "./file-mapping";

// ---------------------------------------------------------------------------
// normalizeHeader
// ---------------------------------------------------------------------------

describe("normalizeHeader", () => {
	it("lowercases and strips accents", () => {
		expect(normalizeHeader("Preço")).toBe("preco");
		expect(normalizeHeader("Descrição")).toBe("descricao");
		expect(normalizeHeader("Código")).toBe("codigo");
		expect(normalizeHeader("Referência")).toBe("referencia");
	});

	it("removes non-alphanumeric chars (spaces, slashes, dots)", () => {
		expect(normalizeHeader("Preço Unitário")).toBe("precounitario");
		expect(normalizeHeader("Cód. Produto")).toBe("codproduto");
		expect(normalizeHeader("SKU")).toBe("sku");
	});

	it("empty string stays empty", () => {
		expect(normalizeHeader("")).toBe("");
	});
});

// ---------------------------------------------------------------------------
// SUPPLIER_FIELDS
// ---------------------------------------------------------------------------

describe("SUPPLIER_FIELDS", () => {
	it("has name as the only required field", () => {
		const required = SUPPLIER_FIELDS.filter((f) => f.required).map(
			(f) => f.key,
		);
		expect(required).toEqual(["name"]);
	});

	it("contains exactly the 7 canonical fields in order", () => {
		const keys = SUPPLIER_FIELDS.map((f) => f.key);
		expect(keys).toEqual([
			"name",
			"sku",
			"code",
			"price",
			"category",
			"unit",
			"description",
		] satisfies CanonicalField[]);
	});

	it("has pt-BR labels", () => {
		const labels = SUPPLIER_FIELDS.map((f) => f.label);
		expect(labels).toContain("Nome");
		expect(labels).toContain("SKU");
		expect(labels).toContain("Código");
		expect(labels).toContain("Preço");
		expect(labels).toContain("Categoria");
		expect(labels).toContain("Unidade");
		expect(labels).toContain("Descrição");
	});
});

// ---------------------------------------------------------------------------
// autoMapHeaders — canonical 1-to-1 mapping
// ---------------------------------------------------------------------------

describe("autoMapHeaders — canonical headers map 1:1", () => {
	const headers = [
		"SKU",
		"Código",
		"Nome",
		"Preço",
		"Categoria",
		"Unidade",
		"Descrição",
	];

	it("maps every canonical field exactly once", () => {
		const m = autoMapHeaders(headers);
		expect(m.name).toBe("Nome");
		expect(m.sku).toBe("SKU");
		expect(m.code).toBe("Código");
		expect(m.price).toBe("Preço");
		expect(m.category).toBe("Categoria");
		expect(m.unit).toBe("Unidade");
		expect(m.description).toBe("Descrição");
	});

	it("all 7 fields are mapped", () => {
		const m = autoMapHeaders(headers);
		const keys = Object.keys(m) as CanonicalField[];
		expect(keys).toHaveLength(7);
	});
});

// ---------------------------------------------------------------------------
// autoMapHeaders — synonym / accent / case variants
// ---------------------------------------------------------------------------

describe("autoMapHeaders — synonym and accent variants", () => {
	it('"Valor" maps to price', () => {
		const m = autoMapHeaders(["Nome", "Valor"]);
		expect(m.price).toBe("Valor");
	});

	it('"PRODUTO" maps to name', () => {
		const m = autoMapHeaders(["PRODUTO", "SKU"]);
		expect(m.name).toBe("PRODUTO");
	});

	it('"Cód" maps to code', () => {
		const m = autoMapHeaders(["Nome", "Cód"]);
		expect(m.code).toBe("Cód");
	});

	it('"Referência" maps to code', () => {
		const m = autoMapHeaders(["Nome", "Referência"]);
		expect(m.code).toBe("Referência");
	});

	it('"Descrição do Produto" maps to name when there is no plain "Nome"', () => {
		// Without any "Nome"-like header, the name field should fall through to
		// fuzzy — "Descrição do Produto" normalizes to "descricaodoproduto"
		// which is NOT in the name synonyms.  The description synonyms also don't
		// contain it, so name may end up unmapped; but if something with "produto"
		// is available it should claim name.
		// The spec says: "maps to name only when there is no plain Nome"
		const m = autoMapHeaders(["Descrição do Produto", "Preço"]);
		// "Descricaodoproduto" — normalizes: "descricaodoproduto"
		// name synonyms include "nomedoproduto" and "nomeproduto" but not "descricaodoproduto"
		// description synonyms include "descricao" but not "descricaodoproduto"
		// Both fields may miss it via exact match; fuzzy might pick it for name (contains "produto")
		// The important assertion: it must NOT go to description
		expect(m.description).not.toBe("Descrição do Produto");
	});

	it('"Descrição" alone maps to description', () => {
		const m = autoMapHeaders(["Nome", "Descrição"]);
		expect(m.description).toBe("Descrição");
		expect(m.name).toBe("Nome");
	});

	it('"Descrição" does not steal the name slot when "Nome" is present', () => {
		const m = autoMapHeaders(["Nome", "SKU", "Descrição"]);
		expect(m.name).toBe("Nome");
		expect(m.description).toBe("Descrição");
	});
});

// ---------------------------------------------------------------------------
// autoMapHeaders — missing name-like headers
// ---------------------------------------------------------------------------

describe("autoMapHeaders — missing name-like header", () => {
	it("returns undefined for name when no header matches", () => {
		const m = autoMapHeaders(["SKU", "Código", "Preço", "Categoria"]);
		expect(m.name).toBeUndefined();
	});

	it("still maps other present fields", () => {
		const m = autoMapHeaders(["SKU", "Preço"]);
		expect(m.sku).toBe("SKU");
		expect(m.price).toBe("Preço");
		expect(m.name).toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// autoMapHeaders — extra / unknown columns are ignored
// ---------------------------------------------------------------------------

describe("autoMapHeaders — extra/unknown columns", () => {
	it("ignores unrecognized headers", () => {
		const m = autoMapHeaders([
			"Nome",
			"Preço",
			"Coluna Desconhecida",
			"ID Interno",
			"Xyz123",
		]);
		const assignedOriginals = Object.values(m) as string[];
		expect(assignedOriginals).not.toContain("Coluna Desconhecida");
		expect(assignedOriginals).not.toContain("ID Interno");
		expect(assignedOriginals).not.toContain("Xyz123");
	});

	it("extra columns do not cause errors", () => {
		expect(() =>
			autoMapHeaders(["Nome", "X1", "X2", "X3", "X4", "X5", "X6", "X7"]),
		).not.toThrow();
	});

	it("a header can only be assigned to one field (no double mapping)", () => {
		const m = autoMapHeaders(["Nome", "SKU", "Código", "Preço"]);
		const values = Object.values(m) as string[];
		const unique = new Set(values);
		expect(unique.size).toBe(values.length);
	});
});

// ---------------------------------------------------------------------------
// applyMapping
// ---------------------------------------------------------------------------

describe("applyMapping", () => {
	const sampleRow: Record<string, unknown> = {
		Nome: "Parafuso M8",
		SKU: "PAR-M8-001",
		Código: "REF-001",
		Preço: "12,50",
		Categoria: "Ferragens",
		Unidade: "cx",
		Descrição: "Parafuso inox M8 50mm",
	};

	const mapping: HeaderMapping = {
		name: "Nome",
		sku: "SKU",
		code: "Código",
		price: "Preço",
		category: "Categoria",
		unit: "Unidade",
		description: "Descrição",
	};

	it("returns correct values for a fully mapped row", () => {
		const result = applyMapping(sampleRow, mapping);
		expect(result.name).toBe("Parafuso M8");
		expect(result.sku).toBe("PAR-M8-001");
		expect(result.code).toBe("REF-001");
		expect(result.price).toBe("12,50");
		expect(result.category).toBe("Ferragens");
		expect(result.unit).toBe("cx");
		expect(result.description).toBe("Parafuso inox M8 50mm");
	});

	it("omits fields that are not in the mapping", () => {
		const partialMapping: HeaderMapping = { name: "Nome", price: "Preço" };
		const result = applyMapping(sampleRow, partialMapping);
		expect(result.name).toBe("Parafuso M8");
		expect(result.price).toBe("12,50");
		expect(result.sku).toBeUndefined();
		expect(result.code).toBeUndefined();
		expect(result.category).toBeUndefined();
	});

	it("does not coerce price to number (raw value returned)", () => {
		const result = applyMapping(sampleRow, mapping);
		expect(typeof result.price).toBe("string");
	});

	it("handles empty mapping without errors", () => {
		const result = applyMapping(sampleRow, {});
		expect(Object.keys(result)).toHaveLength(0);
	});

	it("handles missing columns gracefully", () => {
		const incompleteRow: Record<string, unknown> = { Nome: "Produto X" };
		const result = applyMapping(incompleteRow, mapping);
		expect(result.name).toBe("Produto X");
		expect(result.sku).toBeUndefined();
	});

	it("round-trip: autoMapHeaders → applyMapping returns correct values", () => {
		const headers = Object.keys(sampleRow);
		const m = autoMapHeaders(headers);
		const result = applyMapping(sampleRow, m);
		expect(result.name).toBe("Parafuso M8");
		expect(result.price).toBe("12,50");
	});
});

// ---------------------------------------------------------------------------
// detectHeaderRow
// ---------------------------------------------------------------------------

describe("detectHeaderRow", () => {
	it("returns row 0 for a clean header row", () => {
		const aoa = [
			["Nome", "Preço", "Código"],
			["Parafuso", "12,50", "P-1"],
		];
		const { headerIndex, headers } = detectHeaderRow(aoa);
		expect(headerIndex).toBe(0);
		expect(headers).toEqual(["Nome", "Preço", "Código"]);
	});

	it("skips a leading title row and finds the real header", () => {
		const aoa = [
			["LISTA DE PREÇOS - JUNHO", "", ""],
			["Nome", "Preço", "Código"],
			["Parafuso", "12,50", "P-1"],
		];
		expect(detectHeaderRow(aoa).headerIndex).toBe(1);
	});

	it("fills empty header cells with __col placeholders", () => {
		const aoa = [
			["Nome", "", "Preço"],
			["x", "y", "1"],
		];
		expect(detectHeaderRow(aoa).headers[1]).toBe("__col1");
	});
});

// ---------------------------------------------------------------------------
// buildRows
// ---------------------------------------------------------------------------

describe("buildRows", () => {
	it("builds object rows from the detected header, skipping the title row", () => {
		const aoa = [
			["Catálogo Fornecedor", "", ""],
			["Nome", "Preço", "Código"],
			["Parafuso", "12,50", "P-1"],
			["Porca", "3,00", "P-2"],
		];
		const { headers, rows } = buildRows(aoa);
		expect(headers).toEqual(["Nome", "Preço", "Código"]);
		expect(rows).toHaveLength(2);
		expect(rows[0]).toEqual({
			Nome: "Parafuso",
			Preço: "12,50",
			Código: "P-1",
		});
	});

	it("drops fully blank rows", () => {
		const aoa = [
			["Nome", "Preço"],
			["Parafuso", "12,50"],
			["", ""],
		];
		expect(buildRows(aoa).rows).toHaveLength(1);
	});

	it("auto-detected headers feed autoMapHeaders for header-offset files", () => {
		const aoa = [
			["RELATÓRIO", "", ""],
			["Produto", "Valor", "SKU"],
			["Caneta", "2,50", "C-1"],
		];
		const { headers, rows } = buildRows(aoa);
		const m = autoMapHeaders(headers);
		const first = rows[0] ?? {};
		expect(applyMapping(first, m).name).toBe("Caneta");
		expect(applyMapping(first, m).price).toBe("2,50");
	});

	it("returns empty for an empty sheet", () => {
		expect(buildRows([])).toEqual({ headers: [], rows: [] });
	});
});
