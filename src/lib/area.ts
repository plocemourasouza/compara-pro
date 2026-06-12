/**
 * Área (contexto) do usuário — fonte única da verdade = `Company.type`.
 *
 * Não existe mais `User.role`. A área é derivada da empresa do usuário:
 *  - sem empresa            → ADMIN (plataforma)
 *  - company.type CLIENT    → CLIENT  (/client)
 *  - company.type REPRESENTATIVE → REPRESENTATIVE (/supplier)
 * Empresas SUPPLIER são catálogos sem login, então nunca chegam aqui.
 */

export type Area = "ADMIN" | "REPRESENTATIVE" | "CLIENT";

/** Shape mínimo que getCurrentUser e a camada de authz satisfazem. */
export type AreaUser = { company?: { type?: string | null } | null };

export function areaOf(user: AreaUser): Area {
	const t = user.company?.type;
	if (t === "REPRESENTATIVE") return "REPRESENTATIVE";
	if (t === "CLIENT") return "CLIENT";
	return "ADMIN";
}

export function dashboardForArea(area: Area): string {
	return area === "ADMIN"
		? "/admin"
		: area === "REPRESENTATIVE"
			? "/supplier"
			: "/client";
}
