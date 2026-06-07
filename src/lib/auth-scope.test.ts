import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
vi.mock("@/lib/db", () => ({
	prisma: {
		representativeSupplier: { findMany: (...a: unknown[]) => findMany(...a) },
	},
}));

import {
	getRepresentedSupplierIds,
	resolveRepresentedSupplierIds,
	scopedCompanyFilter,
} from "./auth-scope";

describe("resolveRepresentedSupplierIds (puro)", () => {
	it("retorna os vínculos quando existem", () => {
		expect(resolveRepresentedSupplierIds(["a", "b"], "primary")).toEqual([
			"a",
			"b",
		]);
	});

	it("faz fallback para o fornecedor primário sem vínculos", () => {
		expect(resolveRepresentedSupplierIds([], "primary")).toEqual(["primary"]);
	});

	it("retorna vazio sem vínculos e sem primário", () => {
		expect(resolveRepresentedSupplierIds([], null)).toEqual([]);
	});
});

describe("getRepresentedSupplierIds", () => {
	beforeEach(() => findMany.mockReset());

	it("mapeia os supplierCompanyId dos vínculos", async () => {
		findMany.mockResolvedValue([
			{ supplierCompanyId: "alfa" },
			{ supplierCompanyId: "beta" },
		]);
		const ids = await getRepresentedSupplierIds({
			id: "u1",
			role: "REPRESENTATIVE",
		});
		expect(ids).toEqual(["alfa", "beta"]);
	});

	it("usa companyId primário quando não há vínculos", async () => {
		findMany.mockResolvedValue([]);
		const ids = await getRepresentedSupplierIds({
			id: "u1",
			role: "REPRESENTATIVE",
			company: { id: "primary" },
		});
		expect(ids).toEqual(["primary"]);
	});
});

describe("scopedCompanyFilter", () => {
	beforeEach(() => findMany.mockReset());

	it("ADMIN → undefined (sem filtro)", async () => {
		const f = await scopedCompanyFilter({ id: "admin", role: "ADMIN" });
		expect(f).toBeUndefined();
		expect(findMany).not.toHaveBeenCalled();
	});

	it("representante → { in: ids }", async () => {
		findMany.mockResolvedValue([{ supplierCompanyId: "alfa" }]);
		const f = await scopedCompanyFilter({ id: "u1", role: "REPRESENTATIVE" });
		expect(f).toEqual({ in: ["alfa"] });
	});

	it("representante sem fornecedores → { in: [] } (não vê nada)", async () => {
		findMany.mockResolvedValue([]);
		const f = await scopedCompanyFilter({ id: "u1", role: "REPRESENTATIVE" });
		expect(f).toEqual({ in: [] });
	});
});
