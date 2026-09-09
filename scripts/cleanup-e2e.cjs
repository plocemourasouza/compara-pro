/**
 * Varredura do que a suíte de E2E deixa para trás. Duas frentes:
 *
 * 1. Empresas/usuários órfãos de `supplier-clients.spec.ts`. O teste "adicionar
 *    cliente" cria uma empresa CLIENT + um usuário de contato a cada execução
 *    (POST /api/supplier/clients). A limpeza inline do teste remove só o
 *    vínculo SupplierClient (unlink), nunca a empresa — isso é comportamento
 *    correto de produção (unlink ≠ apagar cliente). Escopo: prefixo de nome e
 *    de e-mail, nunca toca dado semeado.
 *
 * 2. Comparações e pré-pedidos criados durante a rodada. `business-flow.spec.ts`
 *    e `compare-manual-parecer.spec.ts` não limpam o que criam, e adivinhar
 *    "o que é semente" por conteúdo é frágil. Em vez disso o `global-setup`
 *    grava o instante em que a rodada começou (`.e2e-run-start`, escrito
 *    DEPOIS do seed) e aqui apagamos só o que nasceu dessa janela para cá.
 *    Sem o marcador, esta frente não roda — uma execução manual do script
 *    nunca apaga histórico por engano.
 *
 *   node scripts/cleanup-e2e.cjs
 */
require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });
const { existsSync, readFileSync, unlinkSync } = require("node:fs");
const { join } = require("node:path");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const MARKER = join(process.cwd(), ".e2e-run-start");

/** Lê e consome o marcador da rodada. Retorna null se não houver. */
function takeRunStart() {
	if (!existsSync(MARKER)) return null;
	const raw = readFileSync(MARKER, "utf-8").trim();
	const at = new Date(raw);
	unlinkSync(MARKER);
	return Number.isNaN(at.getTime()) ? null : at;
}

/**
 * Apaga comparações e pré-pedidos nascidos depois de `since`, em ordem de FK
 * (o schema não tem nenhum `onDelete`). Devolve as contagens removidas.
 */
async function sweepRunData(prisma, since) {
	const comparisons = await prisma.comparison.findMany({
		where: { createdAt: { gte: since } },
		select: { id: true },
	});
	const comparisonIds = comparisons.map((c) => c.id);

	const preOrders = await prisma.preOrder.findMany({
		where: { createdAt: { gte: since } },
		select: { id: true },
	});
	const preOrderIds = preOrders.map((p) => p.id);

	const matches = comparisonIds.length
		? await prisma.comparisonMatch.findMany({
				where: { comparisonId: { in: comparisonIds } },
				select: { id: true },
			})
		: [];
	const matchIds = matches.map((m) => m.id);

	// Itens de pré-pedido penduram em PreOrder e em ComparisonMatch: saem antes
	// dos dois. Inclui itens de pré-pedidos antigos que apontem para um match
	// desta rodada (não deveria acontecer, mas destravaria o delete se acontecer).
	if (preOrderIds.length || matchIds.length) {
		await prisma.preOrderItem.deleteMany({
			where: {
				OR: [
					...(preOrderIds.length ? [{ preOrderId: { in: preOrderIds } }] : []),
					...(matchIds.length ? [{ matchId: { in: matchIds } }] : []),
				],
			},
		});
	}
	if (preOrderIds.length) {
		await prisma.preOrder.deleteMany({ where: { id: { in: preOrderIds } } });
	}
	if (matchIds.length) {
		await prisma.supplierMatch.deleteMany({
			where: { comparisonMatchId: { in: matchIds } },
		});
		await prisma.comparisonMatch.deleteMany({
			where: { id: { in: matchIds } },
		});
	}
	if (comparisonIds.length) {
		await prisma.comparison.deleteMany({
			where: { id: { in: comparisonIds } },
		});
	}

	const notifications = await prisma.notification.deleteMany({
		where: { createdAt: { gte: since } },
	});

	return {
		comparisons: comparisonIds.length,
		preOrders: preOrderIds.length,
		notifications: notifications.count,
	};
}

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

		const runStart = takeRunStart();
		const run = runStart
			? await sweepRunData(prisma, runStart)
			: { comparisons: 0, preOrders: 0, notifications: 0 };

		console.log(
			`E2E_CLEANUP_OK empresas removidas: ${removed}` +
				` | comparações: ${run.comparisons}` +
				` | pré-pedidos: ${run.preOrders}` +
				` | notificações: ${run.notifications}` +
				`${runStart ? "" : " (sem marcador de rodada)"}`,
		);
	} catch (e) {
		console.log(`E2E_CLEANUP_ERR ${String(e.message).split("\n")[0]}`);
	} finally {
		process.exit(0);
	}
})();
