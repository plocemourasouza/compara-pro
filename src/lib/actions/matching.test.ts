/**
 * Retroactive characterization test — F6 AC-02 / AC-ERROR-01.
 *
 * `createManualMatchAction` already resolves the supplier product from the
 * `products` catalog (via `Product.id`, the real FK target of
 * `SupplierMatch.supplierProductId`); there is no RED phase to replay (see
 * .specs/features/f6-supplier-staging-cleanup). The negative case that
 * matters: before F6 this action could resolve a supplier product id that
 * pointed at `uploadedProduct` (client staging) instead of `products`,
 * producing a dangling FK. Asserting the lookup is `prisma.product.findUnique`
 * — and that a CLIENT-owned product is rejected exactly like a missing one —
 * is what would have caught that regression.
 *
 * Note: this action does not throw on business-rule failures — it catches
 * everything and returns `{ error: string }`. Tests assert on the return
 * value, not on a thrown exception.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/test/auth-mock";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/auth-server", () => ({
	requireAuth: vi.fn().mockResolvedValue(fakeUser("CLIENT", "c1")),
}));

const { createManualMatchAction } = await import("./matching");

function assertNoWrites() {
	expect(prismaMock.comparisonMatch.create).not.toHaveBeenCalled();
	expect(prismaMock.comparisonMatch.update).not.toHaveBeenCalled();
	expect(prismaMock.supplierMatch.create).not.toHaveBeenCalled();
	expect(prismaMock.supplierMatch.update).not.toHaveBeenCalled();
	expect(prismaMock.notification.create).not.toHaveBeenCalled();
}

describe("createManualMatchAction", () => {
	beforeEach(() => {
		resetPrismaMock();
	});

	it("comparison belongs to a different company → error, zero writes (negative case)", async () => {
		prismaMock.comparison.findFirst.mockResolvedValue(null);

		const result = await createManualMatchAction("cmp-1", "prod-1", "cp-1");

		expect(result).toEqual({
			error: "Comparação não encontrada ou não autorizada",
		});
		assertNoWrites();
	});

	it("supplier product not found → error, zero writes", async () => {
		prismaMock.comparison.findFirst.mockResolvedValue({
			id: "cmp-1",
			clientId: "c1",
			// biome-ignore lint/suspicious/noExplicitAny: partial Prisma payload
		} as any);
		prismaMock.product.findUnique.mockResolvedValue(null);

		const result = await createManualMatchAction(
			"cmp-1",
			"prod-missing",
			"cp-1",
		);

		expect(result).toEqual({ error: "Produto do fornecedor não encontrado" });
		expect(prismaMock.product.findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "prod-missing" } }),
		);
		assertNoWrites();
	});

	it("resolved product belongs to a CLIENT company → same error as not-found (negative case)", async () => {
		prismaMock.comparison.findFirst.mockResolvedValue({
			id: "cmp-1",
			clientId: "c1",
			// biome-ignore lint/suspicious/noExplicitAny: partial Prisma payload
		} as any);
		prismaMock.product.findUnique.mockResolvedValue({
			id: "prod-1",
			companyId: "client-co",
			name: "Produto",
			price: 10,
			quantity: 5,
			company: { id: "client-co", type: "CLIENT" },
			// biome-ignore lint/suspicious/noExplicitAny: partial Prisma payload
		} as any);

		const result = await createManualMatchAction("cmp-1", "prod-1", "cp-1");

		expect(result).toEqual({ error: "Produto do fornecedor não encontrado" });
		assertNoWrites();
	});

	function mockValidComparisonAndSupplierProduct() {
		prismaMock.comparison.findFirst.mockResolvedValue({
			id: "cmp-1",
			clientId: "c1",
			// biome-ignore lint/suspicious/noExplicitAny: partial Prisma payload
		} as any);
		prismaMock.product.findUnique.mockResolvedValue({
			id: "prod-1",
			companyId: "supplier-co",
			name: "Parafuso M8",
			price: 12.5,
			quantity: 100,
			company: { id: "supplier-co", type: "SUPPLIER" },
			// biome-ignore lint/suspicious/noExplicitAny: partial Prisma payload
		} as any);
		prismaMock.notification.create.mockResolvedValue(
			// biome-ignore lint/suspicious/noExplicitAny: not asserted on
			{} as any,
		);
	}

	it("existing comparisonMatch + existing supplierMatch → updates both", async () => {
		mockValidComparisonAndSupplierProduct();
		prismaMock.comparisonMatch.findFirst.mockResolvedValue({
			id: "match-1",
			// biome-ignore lint/suspicious/noExplicitAny: partial Prisma payload
		} as any);
		prismaMock.supplierMatch.findFirst.mockResolvedValue({
			id: "smatch-1",
			// biome-ignore lint/suspicious/noExplicitAny: partial Prisma payload
		} as any);

		const result = await createManualMatchAction("cmp-1", "prod-1", "cp-1");

		expect(result).toEqual({
			success: true,
			message: "Match manual criado com sucesso",
		});
		expect(prismaMock.comparisonMatch.update).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: "match-1" },
				data: expect.objectContaining({ matchType: "MANUAL", confidence: 1.0 }),
			}),
		);
		expect(prismaMock.supplierMatch.update).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "smatch-1" } }),
		);
		expect(prismaMock.supplierMatch.create).not.toHaveBeenCalled();
		expect(prismaMock.comparisonMatch.create).not.toHaveBeenCalled();
	});

	it("existing comparisonMatch, no supplierMatch → creates supplierMatch", async () => {
		mockValidComparisonAndSupplierProduct();
		prismaMock.comparisonMatch.findFirst.mockResolvedValue({
			id: "match-1",
			// biome-ignore lint/suspicious/noExplicitAny: partial Prisma payload
		} as any);
		prismaMock.supplierMatch.findFirst.mockResolvedValue(null);

		const result = await createManualMatchAction("cmp-1", "prod-1", "cp-1");

		expect(result).toEqual({
			success: true,
			message: "Match manual criado com sucesso",
		});
		expect(prismaMock.supplierMatch.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					comparisonMatchId: "match-1",
					supplierProductId: "prod-1",
				}),
			}),
		);
		expect(prismaMock.supplierMatch.update).not.toHaveBeenCalled();
	});

	it("no existing match → creates comparisonMatch sourcing supplierProductId from the products catalog", async () => {
		mockValidComparisonAndSupplierProduct();
		prismaMock.comparisonMatch.findFirst.mockResolvedValue(null);

		const result = await createManualMatchAction("cmp-1", "prod-1", "cp-1");

		expect(result).toEqual({
			success: true,
			message: "Match manual criado com sucesso",
		});
		expect(prismaMock.comparisonMatch.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					comparisonId: "cmp-1",
					clientProductId: "cp-1",
					matchType: "MANUAL",
					confidence: 1.0,
					supplierMatches: {
						create: [
							expect.objectContaining({
								supplierProductId: "prod-1",
								supplierCompanyId: "supplier-co",
							}),
						],
					},
				}),
			}),
		);
	});

	it("on success creates a MATCH_CREATED notification", async () => {
		mockValidComparisonAndSupplierProduct();
		prismaMock.comparisonMatch.findFirst.mockResolvedValue(null);

		await createManualMatchAction("cmp-1", "prod-1", "cp-1");

		expect(prismaMock.notification.create).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					userId: "user-1",
					type: "MATCH_CREATED",
				}),
			}),
		);
	});
});
