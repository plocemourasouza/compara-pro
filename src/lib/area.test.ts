import { describe, expect, it } from "vitest";
import { areaOf, dashboardForArea } from "./area";

describe("areaOf", () => {
	describe("mapeamento direto company.type", () => {
		it("REPRESENTATIVE → REPRESENTATIVE", () => {
			const user = { company: { type: "REPRESENTATIVE" } };
			expect(areaOf(user)).toBe("REPRESENTATIVE");
		});

		it("CLIENT → CLIENT", () => {
			const user = { company: { type: "CLIENT" } };
			expect(areaOf(user)).toBe("CLIENT");
		});
	});

	describe("admin da plataforma", () => {
		it("nenhuma chave company → ADMIN", () => {
			const user = {};
			expect(areaOf(user)).toBe("ADMIN");
		});

		it("company: null → ADMIN", () => {
			const user = { company: null };
			expect(areaOf(user)).toBe("ADMIN");
		});
	});

	describe("tipo sem acesso", () => {
		it("company.type null → sem área", () => {
			const user = { company: { type: null } };
			expect(areaOf(user)).toBeNull();
		});

		it("company.type SUPPLIER → sem área", () => {
			const user = { company: { type: "SUPPLIER" } };
			expect(areaOf(user)).toBeNull();
		});

		it('company.type lowercase "client" → sem área', () => {
			const user = { company: { type: "client" } };
			expect(areaOf(user)).toBeNull();
		});

		it('company.type lowercase "representative" → sem área', () => {
			const user = { company: { type: "representative" } };
			expect(areaOf(user)).toBeNull();
		});
	});
});

describe("dashboardForArea", () => {
	it("ADMIN → /admin", () => {
		expect(dashboardForArea("ADMIN")).toBe("/admin");
	});

	it("REPRESENTATIVE → /supplier", () => {
		expect(dashboardForArea("REPRESENTATIVE")).toBe("/supplier");
	});

	it("CLIENT → /client", () => {
		expect(dashboardForArea("CLIENT")).toBe("/client");
	});

	describe("validação de formato", () => {
		it("começa com / (leading slash)", () => {
			expect(dashboardForArea("ADMIN")).toMatch(/^\//);
			expect(dashboardForArea("REPRESENTATIVE")).toMatch(/^\//);
			expect(dashboardForArea("CLIENT")).toMatch(/^\//);
		});

		it("sem trailing slash", () => {
			expect(dashboardForArea("ADMIN")).not.toMatch(/\/$/);
			expect(dashboardForArea("REPRESENTATIVE")).not.toMatch(/\/$/);
			expect(dashboardForArea("CLIENT")).not.toMatch(/\/$/);
		});
	});
});

describe("composição: dashboardForArea(areaOf(user))", () => {
	it("usuário REPRESENTATIVE vai para /supplier", () => {
		const area = areaOf({ company: { type: "REPRESENTATIVE" } });
		expect(area).toBe("REPRESENTATIVE");
		expect(dashboardForArea(area ?? "CLIENT")).toBe("/supplier");
	});

	it("usuário CLIENT vai para /client", () => {
		const area = areaOf({ company: { type: "CLIENT" } });
		expect(area).toBe("CLIENT");
		expect(dashboardForArea(area ?? "ADMIN")).toBe("/client");
	});

	it("usuário sem empresa (ADMIN) vai para /admin", () => {
		const area = areaOf({});
		expect(area).toBe("ADMIN");
		expect(dashboardForArea(area ?? "CLIENT")).toBe("/admin");
	});

	it("usuário SUPPLIER não recebe área de painel", () => {
		const user = { company: { type: "SUPPLIER" } };
		expect(areaOf(user)).toBeNull();
	});
});
