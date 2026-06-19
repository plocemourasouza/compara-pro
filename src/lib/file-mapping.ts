import Fuse from "fuse.js";

// ---------------------------------------------------------------------------
// Public types — CONTRACT (F1 shared library)
// ---------------------------------------------------------------------------

export type CanonicalField =
	| "name"
	| "sku"
	| "code"
	| "price"
	| "category"
	| "unit"
	| "description";

/** canonical field -> ORIGINAL header text in the source file */
export type HeaderMapping = Partial<Record<CanonicalField, string>>;

export interface ExpectedField {
	key: CanonicalField;
	label: string;
	required: boolean;
}

// ---------------------------------------------------------------------------
// Field definitions (pt-BR labels, only name is required)
// ---------------------------------------------------------------------------

export const SUPPLIER_FIELDS: ExpectedField[] = [
	{ key: "name", label: "Nome", required: true },
	{ key: "sku", label: "SKU", required: false },
	{ key: "code", label: "Código", required: false },
	{ key: "price", label: "Preço", required: false },
	{ key: "category", label: "Categoria", required: false },
	{ key: "unit", label: "Unidade", required: false },
	{ key: "description", label: "Descrição", required: false },
];

// ---------------------------------------------------------------------------
// Synonym map — values must already be normalizeHeader-normalized
// ---------------------------------------------------------------------------

const FIELD_SYNONYMS: Record<CanonicalField, string[]> = {
	name: [
		"nome",
		"produto",
		"item",
		"nomeproduto",
		"nomedoproduto",
		"nomedo produto",
	],
	sku: ["sku", "codigosku", "skuproduto"],
	code: [
		"codigo",
		"cod",
		"code",
		"referencia",
		"ref",
		"codprod",
		"codigoproduto",
	],
	price: [
		"preco",
		"valor",
		"price",
		"precounitario",
		"valorunitario",
		"precounit",
		"vlunitario",
		"custo",
		"precovenda",
	],
	category: ["categoria", "grupo", "category", "segmento", "linha"],
	unit: ["unidade", "un", "unid", "unit", "umedida", "unidademedida"],
	description: [
		"descricao",
		"description",
		"obs",
		"observacao",
		"observacoes",
		"detalhe",
		"detalhes",
	],
};

// ---------------------------------------------------------------------------
// normalizeHeader
// ---------------------------------------------------------------------------

/**
 * Normalizes a header string for comparison:
 *   1. Strip accents  (NFD decompose + remove combining marks)
 *   2. Lowercase
 *   3. Remove all non-alphanumeric characters (spaces, punctuation, …)
 *   4. Trim
 *
 * Parity with file-processor.normalizeRow — that function lowercases and
 * removes spaces/special chars but does NOT strip accents; normalizeHeader
 * additionally strips accents so "Preço" → "preco".
 */
export function normalizeHeader(h: string): string {
	return h
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "")
		.trim();
}

// ---------------------------------------------------------------------------
// autoMapHeaders
// ---------------------------------------------------------------------------

/**
 * Maps an array of raw header strings to canonical fields.
 *
 * Strategy (per field, in SUPPLIER_FIELDS order):
 *   1. Exact synonym match — pick the first unassigned header whose
 *      normalizeHeader value is in the field's synonym list.
 *   2. Conservative fuzzy fallback (threshold 0.3) — use Fuse.js to match
 *      the field's synonyms against the normalized form of unassigned headers.
 *      Only accept if no already-assigned header was better.
 *
 * A header can only map to one field.  The mapping value is the ORIGINAL
 * (non-normalized) header text, so callers can do row[mapping[field]].
 */
export function autoMapHeaders(headers: string[]): HeaderMapping {
	const mapping: HeaderMapping = {};

	// Build a lookup: normalizedHeader -> original header
	const normalizedToOriginal = new Map<string, string>();
	for (const h of headers) {
		const n = normalizeHeader(h);
		// First occurrence wins if two headers normalize to the same key
		if (!normalizedToOriginal.has(n)) {
			normalizedToOriginal.set(n, h);
		}
	}

	// Track which normalized headers have already been claimed
	const usedNormalized = new Set<string>();

	for (const field of SUPPLIER_FIELDS) {
		const synonyms = FIELD_SYNONYMS[field.key];

		// Pass 1 — exact synonym match
		let matched: string | undefined;
		for (const norm of normalizedToOriginal.keys()) {
			if (usedNormalized.has(norm)) continue;
			if (synonyms.includes(norm)) {
				matched = norm;
				break;
			}
		}

		if (matched !== undefined) {
			const original = normalizedToOriginal.get(matched);
			if (original !== undefined) {
				mapping[field.key] = original;
				usedNormalized.add(matched);
			}
			continue;
		}

		// Pass 2 — fuzzy fallback against synonyms
		// Build a list of candidate (not yet used) normalized headers
		const candidates = [...normalizedToOriginal.keys()].filter(
			(n) => !usedNormalized.has(n),
		);

		if (candidates.length === 0) continue;

		// We search the synonyms inside the list of candidate headers
		// (Fuse searches items for a query — swap: items = candidates, query = each synonym)
		// Use stricter settings for fuzzy: no ignoreLocation (avoids substring hits
		// on very short synonyms) and only use synonyms of at least 3 chars so
		// tokens like "un" or "ref" don't match arbitrary long headers.
		const fuse = new Fuse(candidates, {
			includeScore: true,
			threshold: 0.15,
			ignoreLocation: false,
			minMatchCharLength: 3,
		});

		let bestNorm: string | undefined;
		let bestScore = 1; // lower is better in Fuse (0 = perfect)

		for (const synonym of synonyms) {
			// Skip very short synonyms in fuzzy mode — they cause false positives
			if (synonym.length < 3) continue;

			const results = fuse.search(synonym);
			for (const result of results) {
				const score = result.score ?? 1;
				if (score < bestScore) {
					bestScore = score;
					bestNorm = result.item;
				}
			}
		}

		if (bestNorm !== undefined) {
			const original = normalizedToOriginal.get(bestNorm);
			if (original !== undefined) {
				mapping[field.key] = original;
				usedNormalized.add(bestNorm);
			}
		}
	}

	return mapping;
}

// ---------------------------------------------------------------------------
// applyMapping
// ---------------------------------------------------------------------------

/**
 * Reads field values out of a raw spreadsheet row using the mapping produced
 * by autoMapHeaders.  Values are returned as-is (no type coercion — price
 * parsing stays in the server's parseNumber).
 */
export function applyMapping(
	row: Record<string, unknown>,
	mapping: HeaderMapping,
): Partial<Record<CanonicalField, unknown>> {
	const result: Partial<Record<CanonicalField, unknown>> = {};

	const field: CanonicalField[] = [
		"name",
		"sku",
		"code",
		"price",
		"category",
		"unit",
		"description",
	];

	for (const f of field) {
		const originalHeader = mapping[f];
		if (originalHeader !== undefined && originalHeader in row) {
			result[f] = row[originalHeader];
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// Header-row detection + row building (files may have a title/blank row above
// the real header). Used by BOTH the browser preview and the server import so
// the chosen column mapping stays consistent on both sides.
// ---------------------------------------------------------------------------

/**
 * Picks the most likely header row from an array-of-arrays sheet. Scans the
 * first rows and chooses the one whose cells map to the most canonical fields
 * (via autoMapHeaders). Ties keep the earliest row; near-empty rows (< 2
 * non-empty cells) are skipped. Falls back to row 0 when nothing scores.
 */
export function detectHeaderRow(rows: unknown[][]): {
	headerIndex: number;
	headers: string[];
} {
	const scan = Math.min(rows.length, 8);
	let bestIndex = 0;
	let bestScore = -1;

	for (let i = 0; i < scan; i++) {
		const cells = (rows[i] ?? []).map((c) => String(c ?? "").trim());
		if (cells.filter((c) => c !== "").length < 2) continue;
		const headerStrings = cells.map((c, idx) => c || `__col${idx}`);
		const score = Object.keys(autoMapHeaders(headerStrings)).length;
		if (score > bestScore) {
			bestScore = score;
			bestIndex = i;
		}
	}

	const headers = (rows[bestIndex] ?? []).map((c, idx) => {
		const s = String(c ?? "").trim();
		return s || `__col${idx}`;
	});

	return { headerIndex: bestIndex, headers };
}

/**
 * Converts an array-of-arrays sheet (XLSX `sheet_to_json(ws, { header: 1 })`)
 * into object rows, auto-detecting the header row and dropping blank rows.
 */
export function buildRows(aoa: unknown[][]): {
	headers: string[];
	rows: Record<string, unknown>[];
} {
	if (aoa.length === 0) return { headers: [], rows: [] };
	const { headerIndex, headers } = detectHeaderRow(aoa);
	const rows = aoa
		.slice(headerIndex + 1)
		.filter(
			(r) => Array.isArray(r) && r.some((c) => String(c ?? "").trim() !== ""),
		)
		.map((r) => {
			const obj: Record<string, unknown> = {};
			headers.forEach((h, i) => {
				obj[h] = (r as unknown[])[i] ?? "";
			});
			return obj;
		});
	return { headers, rows };
}
