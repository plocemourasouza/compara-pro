import { describe, expect, it } from "vitest";
import {
	calculateAveragePrice,
	parseNumber,
	priceChangeDirection,
} from "./parsing-utils";

describe("parseNumber", () => {
	it("returns undefined for empty/null/undefined", () => {
		expect(parseNumber("")).toBeUndefined();
		expect(parseNumber(null)).toBeUndefined();
		expect(parseNumber(undefined)).toBeUndefined();
	});

	it("parses plain numbers", () => {
		expect(parseNumber("42")).toBe(42);
		expect(parseNumber(42)).toBe(42);
		expect(parseNumber("3.5")).toBe(3.5);
	});

	it("parses negative numbers", () => {
		expect(parseNumber("-5")).toBe(-5);
	});

	it("returns undefined for non-numeric", () => {
		expect(parseNumber("abc")).toBeUndefined();
	});

	// KNOWN BUG (pt-BR formatting): "." is treated as decimal and "," is stripped,
	// so "1.234" (thousands) becomes 1.234 and "99,90" becomes 9990.
	// Pinned here to document current behaviour; fix requires locale-aware parsing.
	it("[known bug] mishandles pt-BR thousands/decimal separators", () => {
		expect(parseNumber("R$ 1.234")).toBe(1.234);
		expect(parseNumber("99,90")).toBe(9990);
	});
});

describe("calculateAveragePrice", () => {
	it("returns null for an empty list", () => {
		expect(calculateAveragePrice([])).toBeNull();
	});

	it("averages positive prices", () => {
		expect(calculateAveragePrice([{ price: 10 }, { price: 20 }])).toBe(15);
	});

	it("falls back to targetPrice when price is missing", () => {
		expect(calculateAveragePrice([{ targetPrice: 8 }, { price: 12 }])).toBe(10);
	});

	it("ignores non-positive and null prices", () => {
		expect(
			calculateAveragePrice([{ price: 0 }, { price: -5 }, { price: 10 }]),
		).toBe(10);
	});

	it("returns null when no valid price exists", () => {
		expect(calculateAveragePrice([{ price: 0 }, { price: null }])).toBeNull();
	});
});

describe("priceChangeDirection", () => {
	it("UP when increase exceeds threshold", () => {
		expect(priceChangeDirection(110, 100)).toBe("UP");
	});

	it("DOWN when decrease exceeds threshold", () => {
		expect(priceChangeDirection(90, 100)).toBe("DOWN");
	});

	it("SAME within the default 1% threshold", () => {
		expect(priceChangeDirection(100.5, 100)).toBe("SAME");
	});

	it("respects a custom threshold", () => {
		expect(priceChangeDirection(105, 100, 0.1)).toBe("SAME");
	});
});
