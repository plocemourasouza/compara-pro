/**
 * Pure parsing / price-math utilities for the file processor.
 * No I/O, no state — safe to unit test in isolation.
 */

export type PriceChangeDirection = "UP" | "DOWN" | "SAME";

/** Parse a loose spreadsheet cell into a number, or undefined when not numeric. */
export function parseNumber(value: unknown): number | undefined {
	if (value === null || value === undefined || value === "") {
		return undefined;
	}

	const num = Number.parseFloat(String(value).replace(/[^\d.-]/g, ""));
	return Number.isNaN(num) ? undefined : num;
}

/** Average of positive prices (price falls back to targetPrice). Null when none. */
export function calculateAveragePrice(
	products: { price?: number | null; targetPrice?: number | null }[],
): number | null {
	const prices = products
		.map((p) => p.price || p.targetPrice)
		.filter((price): price is number => price != null && price > 0);

	if (prices.length === 0) {
		return null;
	}

	return prices.reduce((sum, price) => sum + price, 0) / prices.length;
}

/** Direction of change between two averages, within a relative threshold. */
export function priceChangeDirection(
	currentAvg: number,
	previousAvg: number,
	threshold = 0.01,
): PriceChangeDirection {
	const percentChange = (currentAvg - previousAvg) / previousAvg;

	if (percentChange > threshold) return "UP";
	if (percentChange < -threshold) return "DOWN";
	return "SAME";
}
