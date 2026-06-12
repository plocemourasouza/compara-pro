import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({
	prisma: {
		representativeSupplier: { findMany: (...a: unknown[]) => findMany(...a) },
	},
}));

import { getRepresentedSupplierIds, scopedCompanyFilter } from "./auth-scope";

describe("getRepresentedSupplierIds (agency-level)", () => {
	beforeEach(() => findMany.mockReset());

	it("mapeia os supplierCompanyId dos vínculos da agência", async () => {
		findMany.mockResolvedValue([
			{ supplierCompanyId: "alfa" },
			{ supplierCompanyId: "beta" },
		]);
		const ids = await getRepresentedSupplierIds({
			id: "u1",
			area: "REPRESENTATIVE",
			company: { id: "agency1" },
		});
		expect(ids).toEqual(["alfa", "beta"]);
		expect(findMany).toHaveBeenCalledWith({
			where: { representativeCompanyId: "agency1" },
			select: { supplierCompanyId: true },
		});
	});

	it("sem agência (company) → [] e não consulta", async () => {
		const ids = await getRepresentedSupplierIds({
			id: "u1",
			area: "REPRESENTATIVE",
		});
		expect(ids).toEqual([]);
		expect(findMany).not.toHaveBeenCalled();
	});

	it("agência sem fornecedores → []", async () => {
		findMany.mockResolvedValue([]);
		const ids = await getRepresentedSupplierIds({
			id: "u1",
			area: "REPRESENTATIVE",
			company: { id: "agency1" },
		});
		expect(ids).toEqual([]);
	});
});

describe("scopedCompanyFilter", () => {
	beforeEach(() => findMany.mockReset());

	it("ADMIN → undefined (sem filtro)", async () => {
		const f = await scopedCompanyFilter({ id: "admin", area: "ADMIN" });
		expect(f).toBeUndefined();
		expect(findMany).not.toHaveBeenCalled();
	});

	it("representante → { in: ids } da agência", async () => {
		findMany.mockResolvedValue([{ supplierCompanyId: "alfa" }]);
		const f = await scopedCompanyFilter({
			id: "u1",
			area: "REPRESENTATIVE",
			company: { id: "agency1" },
		});
		expect(f).toEqual({ in: ["alfa"] });
	});

	it("representante sem fornecedores → { in: [] } (não vê nada)", async () => {
		findMany.mockResolvedValue([]);
		const f = await scopedCompanyFilter({
			id: "u1",
			area: "REPRESENTATIVE",
			company: { id: "agency1" },
		});
		expect(f).toEqual({ in: [] });
	});
});
