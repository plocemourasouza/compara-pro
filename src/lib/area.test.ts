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

	describe("fallback para ADMIN", () => {
		it("nenhuma chave company → ADMIN", () => {
			const user = {};
			expect(areaOf(user)).toBe("ADMIN");
		});

		it("company: null → ADMIN", () => {
			const user = { company: null };
			expect(areaOf(user)).toBe("ADMIN");
		});

		it("company.type: null → ADMIN", () => {
			const user = { company: { type: null } };
			expect(areaOf(user)).toBe("ADMIN");
		});

		it("company.type SUPPLIER (catálogo sem login) → ADMIN", () => {
			const user = { company: { type: "SUPPLIER" } };
			expect(areaOf(user)).toBe("ADMIN");
		});
	});

	describe("sensibilidade a maiúsculas", () => {
		it('company.type lowercase "client" → ADMIN (não reconhecido)', () => {
			const user = { company: { type: "client" } };
			expect(areaOf(user)).toBe("ADMIN");
		});

		it('company.type lowercase "representative" → ADMIN (não reconhecido)', () => {
			const user = { company: { type: "representative" } };
			expect(areaOf(user)).toBe("ADMIN");
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
		const user = { company: { type: "REPRESENTATIVE" } };
		const area = areaOf(user);
		const dashboard = dashboardForArea(area);
		expect(dashboard).toBe("/supplier");
	});

	it("usuário CLIENT vai para /client", () => {
		const user = { company: { type: "CLIENT" } };
		const area = areaOf(user);
		const dashboard = dashboardForArea(area);
		expect(dashboard).toBe("/client");
	});

	it("usuário sem empresa (ADMIN) vai para /admin", () => {
		const user = {};
		const area = areaOf(user);
		const dashboard = dashboardForArea(area);
		expect(dashboard).toBe("/admin");
	});

	it("usuário SUPPLIER (catálogo) vai para /admin", () => {
		const user = { company: { type: "SUPPLIER" } };
		const area = areaOf(user);
		const dashboard = dashboardForArea(area);
		expect(dashboard).toBe("/admin");
	});
});
