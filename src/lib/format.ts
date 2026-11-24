const BRL = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

export function formatCurrency(value: number): string {
	return BRL.format(value);
}

/**
 * Shows a spreadsheet price as BRL. Column names and other text stay as written.
 * Accepts a raw number from Excel or a pt-BR amount such as "12,50" or "1.234,56".
 */
export function formatImportedPrice(value: unknown): string {
	if (typeof value === "number") {
		return Number.isFinite(value) ? formatCurrency(value) : "";
	}
	const text = String(value ?? "").trim();
	if (text === "") return "";
	const amount = parseImportedAmount(text);
	return amount === null ? text : formatCurrency(amount);
}

function parseImportedAmount(text: string): number | null {
	const bare = text.replace(/^R\$\s*/i, "").trim();
	if (!/^-?\d[\d.,]*$/.test(bare)) return null;
	const lastComma = bare.lastIndexOf(",");
	const lastDot = bare.lastIndexOf(".");
	const normalized =
		lastComma > lastDot
			? bare.replace(/\./g, "").replace(",", ".")
			: bare.replace(/,/g, "");
	const amount = Number(normalized);
	return Number.isFinite(amount) ? amount : null;
}

/** Renders a percent that may be null (zero-denominator) as an em dash. */
export function formatPct(value: number | null): string {
	return value === null ? "—" : `${value.toLocaleString("pt-BR")}%`;
}
