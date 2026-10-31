import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/test/auth-mock";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth-server", () => ({
	getCurrentUser: vi.fn(),
}));

const { getCurrentUser } = await import("@/lib/auth-server");
const { GET } = await import("./route");

describe("GET /api/products", () => {
	beforeEach(() => {
		resetPrismaMock();
	});

	it("limita o comprador aos fornecedores da carteira", async () => {
		vi.mocked(getCurrentUser).mockResolvedValue(
			fakeUser("CLIENT", "client-1") as never,
		);
		prismaMock.supplierClient.findMany.mockResolvedValue([
			{ supplierCompanyId: "s1" },
			{ supplierCompanyId: "s2" },
		] as never);
		prismaMock.product.findMany.mockResolvedValue([]);

		const response = await GET(
			new NextRequest("http://localhost/api/products"),
		);

		expect(response.status).toBe(200);
		expect(prismaMock.product.findMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					companyId: { in: ["s1", "s2"] },
					company: { type: "SUPPLIER" },
				}),
			}),
		);
	});

	it("não lista produto de fornecedor fora da carteira quando o filtro pede esse id", async () => {
		vi.mocked(getCurrentUser).mockResolvedValue(
			fakeUser("CLIENT", "client-1") as never,
		);
		prismaMock.supplierClient.findMany.mockResolvedValue([
			{ supplierCompanyId: "s1" },
		] as never);

		const response = await GET(
			new NextRequest("http://localhost/api/products?companyId=s9"),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ products: [] });
		expect(prismaMock.product.findMany).not.toHaveBeenCalled();
	});
});
