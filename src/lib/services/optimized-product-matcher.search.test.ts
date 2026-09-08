/**
 * Retroactive characterization test — F6 AC-01.
 *
 * `OptimizedProductMatcher.searchProducts` already reads the `products`
 * catalog in production; there is no RED phase to replay here (see
 * PR description / .specs/features/f6-supplier-staging-cleanup). The guard
 * against a tautological test is the negative case in "reads the catalog,
 * never the staging table": before F6, this method queried
 * `uploadedProduct` (client-side staging) instead of `product`
 * (the supplier catalog), which meant results could point at rows with no
 * matching FK. Asserting `uploadedProduct.findMany`/`create` are NEVER
 * called is what would have caught that regression.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { OptimizedProductMatcher } = await import("./optimized-product-matcher");

describe("OptimizedProductMatcher.searchProducts", () => {
	beforeEach(() => {
		resetPrismaMock();
		OptimizedProductMatcher.invalidateCache("all");
	});

	it("queries the products catalog and never the staging table (negative case)", async () => {
		prismaMock.product.findMany.mockResolvedValue([]);

		await OptimizedProductMatcher.searchProducts("parafuso");

		expect(prismaMock.product.findMany).toHaveBeenCalledTimes(1);
		expect(prismaMock.uploadedProduct.findMany).not.toHaveBeenCalled();
		expect(prismaMock.uploadedProduct.create).not.toHaveBeenCalled();
	});

	it("filters by SUPPLIER company, active + priced products, and companyId when supplierId is given", async () => {
		prismaMock.product.findMany.mockResolvedValue([]);

		await OptimizedProductMatcher.searchProducts(
			"parafuso sextavado",
			"supplier-9",
		);

		expect(prismaMock.product.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					company: { type: "SUPPLIER" },
					price: { gt: 0 },
					isActive: true,
					deletedAt: null,
					companyId: "supplier-9",
				}),
			}),
		);
	});

	it("maps the joined company onto the supplier field of each result", async () => {
		prismaMock.product.findMany.mockResolvedValue([
			{
				id: "p1",
				sku: "SKU-1",
				code: null,
				name: "Parafuso M8",
				price: 12.5,
				description: null,
				category: null,
				unit: "un",
				quantity: 100,
				company: { id: "c1", name: "Fornecedor A", type: "SUPPLIER" },
				// biome-ignore lint/suspicious/noExplicitAny: partial Prisma payload shape for the select used
			} as any,
		]);

		const results = await OptimizedProductMatcher.searchProducts("parafuso m8");

		expect(results).toHaveLength(1);
		expect(results[0]?.supplier).toEqual({
			id: "c1",
			name: "Fornecedor A",
			type: "SUPPLIER",
		});
	});

	it("rejects a query shorter than 2 characters with AppError", async () => {
		await expect(OptimizedProductMatcher.searchProducts("a")).rejects.toThrow();
		expect(prismaMock.product.findMany).not.toHaveBeenCalled();
	});
});
