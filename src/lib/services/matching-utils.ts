/**
 * Pure string-matching utilities shared by the product matchers.
 * No I/O, no state — safe to unit test in isolation.
 */

/** Lowercase, trim, collapse whitespace and strip punctuation. */
export function normalizeString(str: string): string {
	return str
		.toLowerCase()
		.trim()
		.replace(/\s+/g, " ")
		.replace(/[^\w\s]/g, "");
}

/**
 * Jaccard similarity over word sets (0..1).
 * Words with length <= `minWordLength` are ignored.
 * Returns 0 when both inputs reduce to empty word sets.
 */
export function jaccardSimilarity(
	str1: string,
	str2: string,
	minWordLength = 2,
): number {
	const words1 = new Set(
		str1.split(" ").filter((w) => w.length > minWordLength),
	);
	const words2 = new Set(
		str2.split(" ").filter((w) => w.length > minWordLength),
	);

	const intersection = new Set([...words1].filter((x) => words2.has(x)));
	const union = new Set([...words1, ...words2]);

	return union.size === 0 ? 0 : intersection.size / union.size;
}
