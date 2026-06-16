import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const repFindFirst = vi.fn();
const scFindFirst = vi.fn();
vi.mock("@/lib/db", () => ({
	prisma: {
		representativeSupplier: {
			findMany: (...a: unknown[]) => findMany(...a),
			findFirst: (...a: unknown[]) => repFindFirst(...a),
		},
		supplierClient: { findFirst: (...a: unknown[]) => scFindFirst(...a) },
	},
}));

import {
	canRevealCnpj,
	getRepresentedSupplierIds,
	scopedCompanyFilter,
} from "./auth-scope";

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

describe("canRevealCnpj (revelação por vínculo)", () => {
	beforeEach(() => {
		findMany.mockReset();
		repFindFirst.mockReset();
		scFindFirst.mockReset();
	});

	it("ADMIN revela qualquer empresa, sem consultar vínculo", async () => {
		const ok = await canRevealCnpj({ id: "admin", area: "ADMIN" }, "x");
		expect(ok).toBe(true);
		expect(repFindFirst).not.toHaveBeenCalled();
		expect(scFindFirst).not.toHaveBeenCalled();
	});

	it("não-admin sem empresa → false, sem consultar", async () => {
		const ok = await canRevealCnpj({ id: "u1", area: "REPRESENTATIVE" }, "x");
		expect(ok).toBe(false);
		expect(repFindFirst).not.toHaveBeenCalled();
	});

	it("representante revela fornecedor que representa", async () => {
		repFindFirst.mockResolvedValue({ supplierCompanyId: "alfa" });
		const ok = await canRevealCnpj(
			{ id: "u1", area: "REPRESENTATIVE", company: { id: "agency1" } },
			"alfa",
		);
		expect(ok).toBe(true);
		expect(repFindFirst).toHaveBeenCalledWith({
			where: {
				representativeCompanyId: "agency1",
				supplierCompanyId: "alfa",
			},
			select: { representativeCompanyId: true },
		});
		expect(scFindFirst).not.toHaveBeenCalled();
	});

	it("representante revela cliente da carteira (vínculo via fornecedor representado)", async () => {
		repFindFirst.mockResolvedValue(null);
		findMany.mockResolvedValue([{ supplierCompanyId: "alfa" }]);
		scFindFirst.mockResolvedValue({ id: "link1" });
		const ok = await canRevealCnpj(
			{ id: "u1", area: "REPRESENTATIVE", company: { id: "agency1" } },
			"cliente1",
		);
		expect(ok).toBe(true);
		expect(scFindFirst).toHaveBeenCalledWith({
			where: {
				supplierCompanyId: { in: ["alfa"] },
				clientCompanyId: "cliente1",
			},
			select: { id: true },
		});
	});

	it("representante NÃO revela empresa sem vínculo", async () => {
		repFindFirst.mockResolvedValue(null);
		findMany.mockResolvedValue([{ supplierCompanyId: "alfa" }]);
		scFindFirst.mockResolvedValue(null);
		const ok = await canRevealCnpj(
			{ id: "u1", area: "REPRESENTATIVE", company: { id: "agency1" } },
			"estranha",
		);
		expect(ok).toBe(false);
	});

	it("cliente revela fornecedor vinculado", async () => {
		scFindFirst.mockResolvedValue({ id: "link1" });
		const ok = await canRevealCnpj(
			{ id: "u2", area: "CLIENT", company: { id: "client1" } },
			"alfa",
		);
		expect(ok).toBe(true);
		expect(scFindFirst).toHaveBeenCalledWith({
			where: { clientCompanyId: "client1", supplierCompanyId: "alfa" },
			select: { id: true },
		});
		expect(repFindFirst).not.toHaveBeenCalled();
	});

	it("cliente NÃO revela fornecedor apenas pendente/avulso", async () => {
		scFindFirst.mockResolvedValue(null);
		const ok = await canRevealCnpj(
			{ id: "u2", area: "CLIENT", company: { id: "client1" } },
			"pendente",
		);
		expect(ok).toBe(false);
	});
});
