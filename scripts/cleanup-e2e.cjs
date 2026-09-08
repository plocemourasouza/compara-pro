/**
 * Varredura das empresas/usuários órfãos deixados pelo E2E (supplier-clients.spec.ts).
 *
 * O teste "adicionar cliente" cria uma empresa CLIENT + um usuário de contato
 * a cada execução (POST /api/supplier/clients). A limpeza inline do teste
 * remove só o vínculo SupplierClient (unlink), nunca a empresa — isso é
 * comportamento correto de produção (unlink ≠ apagar cliente). O órfão que
 * sobra polui /admin/companies e /admin/users; esta varredura existe para
 * isso, escopada por prefixo (nunca toca dados semeados).
 *
 *   node scripts/cleanup-e2e.cjs
 */
require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

(async () => {
	try {
		const candidates = await prisma.company.findMany({
			where: { type: "CLIENT", name: { startsWith: "Cliente E2E " } },
			select: { id: true },
		});
		const ids = candidates.map((c) => c.id);

		const users = ids.length
			? await prisma.user.findMany({
					where: {
						companyId: { in: ids },
						email: { startsWith: "cliente.e2e." },
					},
					select: { id: true },
				})
			: [];
		const userIds = users.map((u) => u.id);

		if (ids.length) {
			await prisma.supplierClient.deleteMany({
				where: { clientCompanyId: { in: ids } },
			});
			await prisma.supplierLinkRequest.deleteMany({
				where: { clientCompanyId: { in: ids } },
			});
		}
		if (userIds.length) {
			await prisma.notification.deleteMany({
				where: { userId: { in: userIds } },
			});
			await prisma.user.deleteMany({
				where: {
					companyId: { in: ids },
					email: { startsWith: "cliente.e2e." },
				},
			});
		}

		// Guarda de segurança: só apaga a empresa se, além do prefixo do nome,
		// ela estiver realmente órfã (nenhuma relação de negócio pendurada nela).
		let removed = 0;
		if (ids.length) {
			const recheck = await prisma.company.findMany({
				where: { id: { in: ids } },
				select: {
					id: true,
					name: true,
					_count: {
						select: {
							users: true,
							products: true,
							uploadHistory: true,
							clientComparisons: true,
							clientPreOrders: true,
							vinculosFornecedor: true,
							linkReqsAsClient: true,
						},
					},
				},
			});
			const safe = recheck.filter((c) =>
				Object.values(c._count).every((n) => n === 0),
			);
			const skipped = recheck.filter(
				(c) => !Object.values(c._count).every((n) => n === 0),
			);
			for (const c of skipped) {
				console.log(
					`E2E_CLEANUP_SKIP ${c.id} (${c.name}) ainda tem relações pendentes`,
				);
			}
			const safeIds = safe.map((c) => c.id);
			if (safeIds.length) {
				await prisma.company.deleteMany({ where: { id: { in: safeIds } } });
			}
			removed = safeIds.length;
		}

		console.log(`E2E_CLEANUP_OK empresas removidas: ${removed}`);
	} catch (e) {
		console.log(`E2E_CLEANUP_ERR ${String(e.message).split("\n")[0]}`);
	} finally {
		process.exit(0);
	}
})();
