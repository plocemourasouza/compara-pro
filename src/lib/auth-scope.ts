import { prisma } from "@/lib/db";

/** Shape mínimo do usuário autenticado (subset de getCurrentUser). */
export type ScopeUser = {
	id: string;
	area: string;
	company?: { id: string } | null;
};

/**
 * IDs das empresas fornecedoras (Company type SUPPLIER) que a AGÊNCIA do usuário
 * (Company type REPRESENTATIVE = `user.company.id`) representa. Todos os usuários
 * da agência compartilham o mesmo conjunto. Sem agência ou sem vínculos → [].
 * Use para escopar produtos, uploads, pré-pedidos e carteira.
 */
export async function getRepresentedSupplierIds(
	user: ScopeUser,
): Promise<string[]> {
	const agencyId = user.company?.id;
	if (!agencyId) return [];
	const links = await prisma.representativeSupplier.findMany({
		where: { representativeCompanyId: agencyId },
		select: { supplierCompanyId: true },
	});
	return links.map((l) => l.supplierCompanyId);
}

/**
 * Filtro de companyId pronto para `where`. ADMIN → `undefined` (sem filtro, vê
 * tudo). Representante → `{ in: ids }` (escopo). Evita ifs espalhados nos
 * call-sites: `where.companyId = await scopedCompanyFilter(user)`.
 */
export async function scopedCompanyFilter(
	user: ScopeUser,
): Promise<{ in: string[] } | undefined> {
	if (user.area === "ADMIN") return undefined;
	return { in: await getRepresentedSupplierIds(user) };
}
