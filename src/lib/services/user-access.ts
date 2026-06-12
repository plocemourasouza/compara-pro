/**
 * Autorização pura da gestão de usuários (sem I/O — testável isolado).
 *
 * Modelo: ADMIN gerencia tudo (global). Não-admin (REPRESENTATIVE/CLIENT) só
 * gerencia a própria equipe — usuários do MESMO papel e da MESMA empresa
 * (`company.id`). Estas funções são a fronteira de autorização: os route
 * handlers as chamam e traduzem o resultado em 403/404. Não confiar no layout
 * (que apenas redireciona) — a regra de verdade está aqui.
 */

export type AccessRole = "ADMIN" | "REPRESENTATIVE" | "CLIENT";

/** Subset do usuário autenticado (espelha getCurrentUser / ScopeUser). */
export type Actor = {
	id: string;
	area: string;
	company?: { id: string } | null;
};

/** Filtro de listagem pronto para `where`, ou bloqueio explícito. */
export type ListScope =
	| { role: AccessRole; companyId?: string }
	| { forbidden: true };

/**
 * Escopo da listagem. `sessionRole` é o papel da área (REPRESENTATIVE em
 * /supplier, CLIENT em /client, ADMIN em /admin). ADMIN vê todos daquele papel
 * sem filtro de empresa; não-admin é forçado ao próprio papel + própria empresa
 * e é bloqueado se cair numa área de papel diferente do seu.
 */
export function resolveUserListScope(
	actor: Actor,
	sessionRole: AccessRole,
): ListScope {
	if (actor.area === "ADMIN") return { role: sessionRole };
	if (actor.area !== sessionRole) return { forbidden: true };
	return {
		role: actor.area as AccessRole,
		companyId: actor.company?.id ?? "__none__",
	};
}

export type CreateInput = {
	name?: string;
	role?: string;
	companyId?: string;
	companyName?: string;
};

export type CreateDecision =
	| {
			ok: true;
			role: AccessRole;
			companyId?: string;
			allowCompanyAutoCreate: boolean;
	  }
	| {
			ok: false;
			reason:
				| "forbidden_area"
				| "role_escalation"
				| "cross_company"
				| "no_company";
	  };

/**
 * Valida/normaliza a criação. ADMIN: papel livre (default = papel da sessão),
 * empresa pode ser auto-criada por nome. Não-admin: papel e empresa FORÇADOS
 * aos próprios; qualquer tentativa de outro papel (incl. ADMIN) ou empresa
 * alheia é rejeitada — nunca silenciosamente aceita.
 */
export function sanitizeUserCreate(
	actor: Actor,
	input: CreateInput,
	sessionRole: AccessRole,
): CreateDecision {
	if (actor.area === "ADMIN") {
		return {
			ok: true,
			role: (input.role as AccessRole) ?? sessionRole,
			companyId: input.companyId,
			allowCompanyAutoCreate: true,
		};
	}

	if (actor.area !== sessionRole)
		return { ok: false, reason: "forbidden_area" };
	if (input.role && input.role !== actor.area) {
		return { ok: false, reason: "role_escalation" };
	}
	if (!actor.company?.id) return { ok: false, reason: "no_company" };
	if (input.companyId && input.companyId !== actor.company.id) {
		return { ok: false, reason: "cross_company" };
	}

	return {
		ok: true,
		role: actor.area as AccessRole,
		companyId: actor.company.id,
		allowCompanyAutoCreate: false,
	};
}

export type MutationOp = "update" | "deactivate" | "reactivate" | "resend";
export type MutationTarget = {
	id: string;
	area: string;
	companyId?: string | null;
};

/**
 * Pode o ator mutar este alvo? Ninguém desativa a própria conta. ADMIN pode
 * todo o resto. Não-admin só alvos do mesmo papel + mesma empresa (e nunca um
 * ADMIN). Alvo fora de escopo → false; o handler responde 404 (não 403) para
 * não vazar existência.
 */
export function canMutateTarget(
	actor: Actor,
	target: MutationTarget,
	op: MutationOp,
): boolean {
	if (op === "deactivate" && target.id === actor.id) return false;
	if (actor.area === "ADMIN") return true;
	if (target.area === "ADMIN") return false;
	if (target.area !== actor.area) return false;
	return !!actor.company?.id && target.companyId === actor.company.id;
}

/**
 * Remove campos que não-admin não pode alterar (papel e empresa) antes do
 * update. ADMIN mantém o patch intacto.
 */
export function lockUpdateFields<T extends Record<string, unknown>>(
	actor: Actor,
	data: T,
): Partial<T> {
	if (actor.area === "ADMIN") return data;
	const { role: _role, companyId: _companyId, ...rest } = data;
	return rest as Partial<T>;
}
