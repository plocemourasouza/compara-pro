import { describe, expect, it } from "vitest";
import { jaccardSimilarity, normalizeString } from "./matching-utils";

describe("normalizeString", () => {
	it("lowercases and trims", () => {
		expect(normalizeString("  Hello World  ")).toBe("hello world");
	});

	it("collapses repeated whitespace", () => {
		expect(normalizeString("a   b\t c")).toBe("a b c");
	});

	it("strips punctuation but keeps word chars", () => {
		expect(normalizeString("Caneta-BIC, 0.7mm!")).toBe("canetabic 07mm");
	});

	it("leaves already-normalized input unchanged", () => {
		expect(normalizeString("parafuso 10mm")).toBe("parafuso 10mm");
	});
});

describe("jaccardSimilarity", () => {
	it("returns 1 for identical word sets", () => {
		expect(
			jaccardSimilarity("parafuso sextavado aco", "parafuso sextavado aco"),
		).toBe(1);
	});

	it("returns 0 for disjoint sets", () => {
		expect(jaccardSimilarity("parafuso metal", "caneta papel")).toBe(0);
	});

	it("ignores short words (<= minWordLength)", () => {
		// "de"/"da" (length 2) are filtered out with default minWordLength=2
		expect(jaccardSimilarity("caixa de papel", "caixa da papel")).toBe(1);
	});

	it("computes partial overlap", () => {
		// {parafuso, sextavado} vs {parafuso, philips} -> 1/3
		expect(
			jaccardSimilarity("parafuso sextavado", "parafuso philips"),
		).toBeCloseTo(1 / 3);
	});

	it("returns 0 when both reduce to empty sets", () => {
		// all words length <= 2 are filtered, leaving empty sets
		expect(jaccardSimilarity("a b", "c d")).toBe(0);
	});
});
