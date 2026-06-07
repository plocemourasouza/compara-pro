const BRL = new Intl.NumberFormat("pt-BR", {
	style: "currency",
	currency: "BRL",
});

export function formatCurrency(value: number): string {
	return BRL.format(value);
}

/** Renders a percent that may be null (zero-denominator) as an em dash. */
export function formatPct(value: number | null): string {
	return value === null ? "—" : `${value.toLocaleString("pt-BR")}%`;
}
