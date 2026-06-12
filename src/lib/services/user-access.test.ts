import { describe, expect, it } from "vitest";
import {
	canMutateTarget,
	lockUpdateFields,
	resolveUserListScope,
	sanitizeUserCreate,
} from "./user-access";

const admin = { id: "admin1", role: "ADMIN" } as const;
const rep = {
	id: "rep1",
	role: "REPRESENTATIVE",
	company: { id: "co-sup" },
} as const;
const cli = {
	id: "cli1",
	role: "CLIENT",
	company: { id: "co-cli" },
} as const;

describe("resolveUserListScope", () => {
	it("ADMIN vê todos do papel da sessão, sem filtro de empresa", () => {
		expect(resolveUserListScope(admin, "REPRESENTATIVE")).toEqual({
			role: "REPRESENTATIVE",
		});
		expect(resolveUserListScope(admin, "ADMIN")).toEqual({ role: "ADMIN" });
	});

	it("não-admin é forçado ao próprio papel + própria empresa", () => {
		expect(resolveUserListScope(rep, "REPRESENTATIVE")).toEqual({
			role: "REPRESENTATIVE",
			companyId: "co-sup",
		});
		expect(resolveUserListScope(cli, "CLIENT")).toEqual({
			role: "CLIENT",
			companyId: "co-cli",
		});
	});

	it("não-admin em área de outro papel → forbidden", () => {
		expect(resolveUserListScope(rep, "CLIENT")).toEqual({ forbidden: true });
		expect(resolveUserListScope(cli, "REPRESENTATIVE")).toEqual({
			forbidden: true,
		});
	});
});

describe("sanitizeUserCreate", () => {
	it("ADMIN pode criar qualquer papel e auto-criar empresa", () => {
		const r = sanitizeUserCreate(
			admin,
			{ role: "REPRESENTATIVE", companyName: "Agência X" },
			"REPRESENTATIVE",
		);
		expect(r).toMatchObject({
			ok: true,
			role: "REPRESENTATIVE",
			allowCompanyAutoCreate: true,
		});
	});

	it("ADMIN cria ADMIN na sessão admin", () => {
		const r = sanitizeUserCreate(admin, { role: "ADMIN" }, "ADMIN");
		expect(r).toMatchObject({ ok: true, role: "ADMIN" });
	});

	it("não-admin: papel e empresa forçados ao próprio, sem auto-criar empresa", () => {
		const r = sanitizeUserCreate(rep, { name: "Colega" }, "REPRESENTATIVE");
		expect(r).toEqual({
			ok: true,
			role: "REPRESENTATIVE",
			companyId: "co-sup",
			allowCompanyAutoCreate: false,
		});
	});

	it("não-admin tentando criar ADMIN → role_escalation (bloqueado)", () => {
		const r = sanitizeUserCreate(rep, { role: "ADMIN" }, "REPRESENTATIVE");
		expect(r).toEqual({ ok: false, reason: "role_escalation" });
	});

	it("não-admin tentando criar outro papel → role_escalation", () => {
		const r = sanitizeUserCreate(rep, { role: "CLIENT" }, "REPRESENTATIVE");
		expect(r).toEqual({ ok: false, reason: "role_escalation" });
	});

	it("não-admin tentando empresa alheia → cross_company", () => {
		const r = sanitizeUserCreate(
			rep,
			{ companyId: "co-outra" },
			"REPRESENTATIVE",
		);
		expect(r).toEqual({ ok: false, reason: "cross_company" });
	});

	it("não-admin em área de outro papel → forbidden_area", () => {
		const r = sanitizeUserCreate(cli, { name: "X" }, "REPRESENTATIVE");
		expect(r).toEqual({ ok: false, reason: "forbidden_area" });
	});

	it("não-admin sem empresa → no_company", () => {
		const orphan = { id: "x", role: "REPRESENTATIVE" } as const;
		const r = sanitizeUserCreate(orphan, { name: "X" }, "REPRESENTATIVE");
		expect(r).toEqual({ ok: false, reason: "no_company" });
	});
});

describe("canMutateTarget", () => {
	it("ADMIN gerencia qualquer alvo", () => {
		expect(
			canMutateTarget(admin, { id: "t", role: "REPRESENTATIVE" }, "update"),
		).toBe(true);
		expect(
			canMutateTarget(admin, { id: "t", role: "ADMIN" }, "deactivate"),
		).toBe(true);
	});

	it("ninguém desativa a própria conta (nem admin)", () => {
		expect(
			canMutateTarget(admin, { id: "admin1", role: "ADMIN" }, "deactivate"),
		).toBe(false);
		expect(
			canMutateTarget(
				rep,
				{ id: "rep1", role: "REPRESENTATIVE", companyId: "co-sup" },
				"deactivate",
			),
		).toBe(false);
	});

	it("não-admin gerencia só mesmo papel + mesma empresa", () => {
		expect(
			canMutateTarget(
				rep,
				{ id: "rep2", role: "REPRESENTATIVE", companyId: "co-sup" },
				"update",
			),
		).toBe(true);
	});

	it("não-admin não toca empresa alheia", () => {
		expect(
			canMutateTarget(
				rep,
				{ id: "rep9", role: "REPRESENTATIVE", companyId: "co-outra" },
				"update",
			),
		).toBe(false);
	});

	it("não-admin não toca outro papel nem ADMIN", () => {
		expect(
			canMutateTarget(
				rep,
				{ id: "c", role: "CLIENT", companyId: "co-sup" },
				"update",
			),
		).toBe(false);
		expect(
			canMutateTarget(
				rep,
				{ id: "a", role: "ADMIN", companyId: "co-sup" },
				"update",
			),
		).toBe(false);
	});

	it("cliente não toca representante", () => {
		expect(
			canMutateTarget(
				cli,
				{ id: "r", role: "REPRESENTATIVE", companyId: "co-cli" },
				"update",
			),
		).toBe(false);
	});
});

describe("lockUpdateFields", () => {
	it("ADMIN mantém role/companyId no patch", () => {
		const data = { name: "Novo", role: "ADMIN", companyId: "x" };
		expect(lockUpdateFields(admin, data)).toEqual(data);
	});

	it("não-admin não consegue alterar role nem companyId", () => {
		const data = { name: "Novo", role: "ADMIN", companyId: "x" };
		expect(lockUpdateFields(rep, data)).toEqual({ name: "Novo" });
	});
});
