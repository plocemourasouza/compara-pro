import { describe, expect, it } from "vitest";
import { createPreOrderBatchSchema, createPreOrderSchema } from "./pre-order";

describe("createPreOrderBatchSchema", () => {
	const valid = {
		comparisonId: "cmp1",
		groups: [
			{
				supplierId: "sup1",
				selectedMatches: ["m1", "m2"],
				quantities: { m1: 3 },
			},
		],
		notes: "ok",
	};

	it("accepts a well-formed batch", () => {
		expect(createPreOrderBatchSchema.safeParse(valid).success).toBe(true);
	});

	it("rejects an empty groups array", () => {
		expect(
			createPreOrderBatchSchema.safeParse({ ...valid, groups: [] }).success,
		).toBe(false);
	});

	it("rejects a group with no selected matches", () => {
		const bad = {
			...valid,
			groups: [{ supplierId: "sup1", selectedMatches: [] }],
		};
		expect(createPreOrderBatchSchema.safeParse(bad).success).toBe(false);
	});

	it("rejects a missing comparisonId", () => {
		const { comparisonId: _omit, ...bad } = valid;
		expect(createPreOrderBatchSchema.safeParse(bad).success).toBe(false);
	});

	it("rejects non-positive quantities", () => {
		const bad = {
			...valid,
			groups: [
				{ supplierId: "sup1", selectedMatches: ["m1"], quantities: { m1: 0 } },
			],
		};
		expect(createPreOrderBatchSchema.safeParse(bad).success).toBe(false);
	});
});

describe("createPreOrderSchema", () => {
	it("accepts a single-supplier pre-order", () => {
		const ok = createPreOrderSchema.safeParse({
			comparisonId: "cmp1",
			supplierId: "sup1",
			selectedMatches: ["m1"],
		});
		expect(ok.success).toBe(true);
	});

	it("rejects no selected matches", () => {
		const bad = createPreOrderSchema.safeParse({
			comparisonId: "cmp1",
			supplierId: "sup1",
			selectedMatches: [],
		});
		expect(bad.success).toBe(false);
	});
});
