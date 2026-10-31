/**
 * Área (contexto) do usuário — fonte única da verdade = `Company.type`.
 *
 * Não existe mais `User.role`. A área é derivada da empresa do usuário:
 *  - sem empresa                 → ADMIN (operador da plataforma)
 *  - company.type CLIENT         → CLIENT (/client)
 *  - company.type REPRESENTATIVE → REPRESENTATIVE (/supplier)
 *  - SUPPLIER, tipo nulo ou desconhecido → null (sem acesso)
 *
 * Null é falha fechada. Catálogo de fornecedor não vira administrador.
 */

export type Area = "ADMIN" | "REPRESENTATIVE" | "CLIENT";

/** Shape mínimo que getCurrentUser e a camada de authz satisfazem. */
export type AreaUser = { company?: { type?: string | null } | null };

export function areaOf(user: AreaUser): Area | null {
	if (user.company == null) return "ADMIN";
	if (user.company.type === "REPRESENTATIVE") return "REPRESENTATIVE";
	if (user.company.type === "CLIENT") return "CLIENT";
	return null;
}

export function dashboardForArea(area: Area): string {
	return area === "ADMIN"
		? "/admin"
		: area === "REPRESENTATIVE"
			? "/supplier"
			: "/client";
}
