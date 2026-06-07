import { describe, expect, it } from "vitest";
import { preOrderScopeWhere } from "./pre-order-scope";

describe("preOrderScopeWhere", () => {
	it("ADMIN vê todos (where vazio)", () => {
		expect(
			preOrderScopeWhere({ clientId: "c1", supplierIds: ["s1"] }, "ADMIN"),
		).toEqual({});
	});

	it("CLIENT escopa pela própria empresa", () => {
		expect(preOrderScopeWhere({ clientId: "c1" }, "CLIENT")).toEqual({
			clientId: "c1",
		});
	});

	it("REPRESENTATIVE escopa por todos os fornecedores representados", () => {
		expect(
			preOrderScopeWhere({ supplierIds: ["alfa", "beta"] }, "REPRESENTATIVE"),
		).toEqual({ supplierId: { in: ["alfa", "beta"] } });
	});

	it("REPRESENTATIVE sem fornecedores não vê nada (in vazio)", () => {
		expect(preOrderScopeWhere({ supplierIds: [] }, "REPRESENTATIVE")).toEqual({
			supplierId: { in: [] },
		});
	});

	it("CLIENT sem empresa cai para clientId vazio (não vaza outros)", () => {
		expect(preOrderScopeWhere({ clientId: null }, "CLIENT")).toEqual({
			clientId: "",
		});
	});
});
