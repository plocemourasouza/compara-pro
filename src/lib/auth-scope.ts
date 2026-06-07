import { prisma } from "@/lib/db";

/** Shape mínimo do usuário autenticado (subset de getCurrentUser). */
export type ScopeUser = {
	id: string;
	role: string;
	company?: { id: string } | null;
};

/**
 * Puro: resolve o conjunto de fornecedores representados a partir dos vínculos.
 * Fallback para o fornecedor primário (User.companyId) quando não há vínculos —
 * mantém bases não-backfilladas funcionando. Sem vínculos e sem primário → [].
 */
export function resolveRepresentedSupplierIds(
	linkIds: string[],
	primaryCompanyId?: string | null,
): string[] {
	if (linkIds.length > 0) return linkIds;
	return primaryCompanyId ? [primaryCompanyId] : [];
}

/**
 * IDs das empresas fornecedoras (Company type SUPPLIER) que o representante
 * representa. Use para escopar produtos, uploads, pré-pedidos e carteira.
 */
export async function getRepresentedSupplierIds(
	user: ScopeUser,
): Promise<string[]> {
	const links = await prisma.representativeSupplier.findMany({
		where: { representativeId: user.id },
		select: { supplierCompanyId: true },
	});
	return resolveRepresentedSupplierIds(
		links.map((l) => l.supplierCompanyId),
		user.company?.id,
	);
}

/**
 * Filtro de companyId pronto para `where`. ADMIN → `undefined` (sem filtro, vê
 * tudo). Representante → `{ in: ids }` (escopo). Evita ifs espalhados nos
 * call-sites: `where.companyId = await scopedCompanyFilter(user)`.
 */
export async function scopedCompanyFilter(
	user: ScopeUser,
): Promise<{ in: string[] } | undefined> {
	if (user.role === "ADMIN") return undefined;
	return { in: await getRepresentedSupplierIds(user) };
}
