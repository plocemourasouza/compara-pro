/**
 * Retroactive characterization test — F6 AC-03 / AC-04.
 *
 * `FileProcessor["processData"]` already writes supplier rows to the
 * `products` catalog (upsert) instead of the `uploadedProduct` staging
 * table; there is no RED phase to replay (see
 * .specs/features/f6-supplier-staging-cleanup). The negative case that
 * matters: before F6, a SUPPLIER_PRODUCTS upload wrote to `uploadedProduct`
 * — the same staging table client requirements use — which is what made
 * supplier products invisible to `products`-based matching/search.
 * Asserting `uploadedProduct.create` is NEVER called for a supplier upload
 * is what would have caught that regression.
 *
 * `processData` is a private static method; accessed via bracket notation
 * (`FileProcessor["processData"]`), which type-checks without `any`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const { FileProcessor } = await import("./file-processor");

describe("FileProcessor.processData — staging vs catalog routing", () => {
	beforeEach(() => {
		resetPrismaMock();
	});

	it("SUPPLIER_PRODUCTS row → writes to the products catalog, never uploadedProduct (negative case)", async () => {
		prismaMock.product.upsert.mockResolvedValue(
			// biome-ignore lint/suspicious/noExplicitAny: not asserted on
			{} as any,
		);
		const rows = [{ Sku: "SKU-1", Name: "Parafuso M8", Price: "12.50" }];

		// biome-ignore lint/complexity/useLiteralKeys: acesso por colchete alcança o método privado sem recorrer a `any` (ver docblock do arquivo)
		const result = await FileProcessor["processData"](
			rows,
			"upload-1",
			"SUPPLIER_PRODUCTS",
			"company-1",
		);

		expect(result.errors).toEqual([]);
		expect(result.processedRows).toBe(1);
		expect(prismaMock.uploadedProduct.create).not.toHaveBeenCalled();
		expect(prismaMock.product.upsert).toHaveBeenCalledTimes(1);
		expect(prismaMock.product.upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { companyId_sku: { companyId: "company-1", sku: "SKU-1" } },
			}),
		);
	});

	it("CLIENT_REQUIREMENTS row → writes to uploadedProduct with numeric targetPrice/quantity and originalRow: 2", async () => {
		prismaMock.uploadedProduct.create.mockResolvedValue(
			// biome-ignore lint/suspicious/noExplicitAny: not asserted on
			{} as any,
		);
		const rows = [
			{
				Name: "Parafuso M8",
				TargetPrice: "9.90",
				Quantity: "50",
			},
		];

		// biome-ignore lint/complexity/useLiteralKeys: acesso por colchete alcança o método privado sem recorrer a `any` (ver docblock do arquivo)
		const result = await FileProcessor["processData"](
			rows,
			"upload-2",
			"CLIENT_REQUIREMENTS",
			"company-2",
		);

		expect(result.errors).toEqual([]);
		expect(prismaMock.uploadedProduct.create).toHaveBeenCalledTimes(1);
		expect(prismaMock.uploadedProduct.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					uploadId: "upload-2",
					originalRow: 2,
					targetPrice: 9.9,
					quantity: 50,
				}),
			}),
		);
	});

	it("an invalid row (missing required name) produces errors[0].row === 2 and no write", async () => {
		const rows = [{ Sku: "SKU-1", Price: "12.50" }];

		// biome-ignore lint/complexity/useLiteralKeys: acesso por colchete alcança o método privado sem recorrer a `any` (ver docblock do arquivo)
		const result = await FileProcessor["processData"](
			rows,
			"upload-3",
			"SUPPLIER_PRODUCTS",
			"company-1",
		);

		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]?.row).toBe(2);
		expect(result.processedRows).toBe(0);
		expect(prismaMock.product.upsert).not.toHaveBeenCalled();
		expect(prismaMock.product.create).not.toHaveBeenCalled();
		expect(prismaMock.uploadedProduct.create).not.toHaveBeenCalled();
	});
});
