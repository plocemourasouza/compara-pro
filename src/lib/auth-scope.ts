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

/**
 * Pode o usuário revelar o CNPJ completo da empresa `targetCompanyId`? O CNPJ é
 * exibido anonimizado por padrão (LGPD); a revelação sob demanda exige vínculo:
 *
 * - ADMIN: irrestrito (operador da plataforma).
 * - REPRESENTATIVE: fornecedor que a agência representa (`RepresentativeSupplier`)
 *   ou cliente na carteira de algum fornecedor representado (`SupplierClient`).
 * - CLIENT: fornecedor com vínculo ativo (`SupplierClient`). Fornecedor apenas
 *   pendente/avulso (sem link) → false.
 *
 * Fronteira de autorização: o handler de reveal traduz `false` em 403.
 */
export async function canRevealCnpj(
	user: ScopeUser,
	targetCompanyId: string,
): Promise<boolean> {
	if (user.area === "ADMIN") return true;

	const myCompanyId = user.company?.id;
	if (!myCompanyId) return false;

	if (user.area === "REPRESENTATIVE") {
		const represented = await prisma.representativeSupplier.findFirst({
			where: {
				representativeCompanyId: myCompanyId,
				supplierCompanyId: targetCompanyId,
			},
			select: { representativeCompanyId: true },
		});
		if (represented) return true;

		const supplierIds = await getRepresentedSupplierIds(user);
		if (supplierIds.length === 0) return false;
		const inCarteira = await prisma.supplierClient.findFirst({
			where: {
				supplierCompanyId: { in: supplierIds },
				clientCompanyId: targetCompanyId,
			},
			select: { id: true },
		});
		return !!inCarteira;
	}

	if (user.area === "CLIENT") {
		const link = await prisma.supplierClient.findFirst({
			where: {
				clientCompanyId: myCompanyId,
				supplierCompanyId: targetCompanyId,
			},
			select: { id: true },
		});
		return !!link;
	}

	return false;
}
