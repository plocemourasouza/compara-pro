import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const TREND_DAYS = 30;
const LOW_CONFIDENCE = 0.7;
const AGING_DAYS = 7;
const LEADERBOARD_SIZE = 5;

/** percent helper that fails safe to null on a zero denominator (UI renders "—"). */
function pct(numerator: number, denominator: number): number | null {
	if (denominator <= 0) return null;
	return Math.round((numerator / denominator) * 1000) / 10; // 1 casa decimal
}

/** yyyy-mm-dd bucket key. NOTE: buckets in UTC (toISOString), like the rest of
 * the app's date handling — acceptable skew for a POC. Switch to a fixed
 * America/Sao_Paulo offset if exact day boundaries ever matter. */
function dayKey(d: Date): string {
	return d.toISOString().slice(0, 10);
}

export async function GET() {
	try {
		await requireAuth(["ADMIN"]);

		const now = new Date();
		const windowStart = new Date(now.getTime() - (TREND_DAYS - 1) * 86_400_000);
		windowStart.setHours(0, 0, 0, 0);
		const agingBefore = new Date(now.getTime() - AGING_DAYS * 86_400_000);

		const [
			requirementUploads,
			comparisons,
			preOrdersCreated,
			preOrdersByStatus,
			gmvTotal,
			gmvFinalized,
			gmvOpen,
			savingsItems,
			comparisonTotals,
			matchesByType,
			lowConfidenceCount,
			pendingLinkRequests,
			agingLinkRequests,
			finalizedBySupplier,
			repLinks,
			topClientsRaw,
			uploadsTotal,
			uploadsFailed,
			errorRowsAgg,
			uploadRows,
			preOrderRows,
			activeListSuppliers,
			activeCatalogCount,
			activeCatalogValue,
			activePoClients,
			activePoSuppliers,
			activePoItems,
		] = await Promise.all([
			// Funil
			prisma.uploadHistory.count({
				where: { uploadType: "CLIENT_REQUIREMENTS" },
			}),
			prisma.comparison.count(),
			prisma.preOrder.count(),
			prisma.preOrder.groupBy({ by: ["status"], _count: { status: true } }),
			// GMV
			prisma.preOrder.aggregate({ _sum: { totalAmount: true } }),
			prisma.preOrder.aggregate({
				_sum: { totalAmount: true },
				where: { status: "FINALIZED" },
			}),
			prisma.preOrder.aggregate({
				_sum: { totalAmount: true },
				where: { status: "ACTIVE" },
			}),
			// Economia em pré-pedidos finalizados (baseline capturado na criação)
			prisma.preOrderItem.findMany({
				where: {
					preOrder: { status: "FINALIZED" },
					baselinePrice: { not: null },
				},
				select: { baselinePrice: true, price: true, quantity: true },
			}),
			// Matching
			prisma.comparison.aggregate({
				_sum: { totalProducts: true, matchedProducts: true },
			}),
			prisma.comparisonMatch.groupBy({
				by: ["matchType"],
				_count: { matchType: true },
			}),
			prisma.comparisonMatch.count({
				where: { confidence: { lt: LOW_CONFIDENCE } },
			}),
			// Atenção
			prisma.supplierLinkRequest.count({ where: { status: "PENDING" } }),
			prisma.supplierLinkRequest.count({
				where: { status: "PENDING", createdAt: { lt: agingBefore } },
			}),
			// Leaderboards (valores finalizados). Fornecedores: todos (sem take) p/
			// reatribuir aos representantes via RepresentativeSupplier.
			prisma.preOrder.groupBy({
				by: ["supplierId"],
				_sum: { totalAmount: true },
				where: { status: "FINALIZED" },
			}),
			prisma.representativeSupplier.findMany({
				select: {
					representativeId: true,
					supplierCompanyId: true,
					representative: { select: { name: true } },
				},
			}),
			prisma.preOrder.groupBy({
				by: ["clientId"],
				_sum: { totalAmount: true },
				where: { status: "FINALIZED" },
				orderBy: { _sum: { totalAmount: "desc" } },
				take: LEADERBOARD_SIZE,
			}),
			// Saúde de uploads
			prisma.uploadHistory.count(),
			prisma.uploadHistory.count({ where: { status: "FAILED" } }),
			prisma.uploadHistory.aggregate({ _sum: { errorRows: true } }),
			// Tendência — linhas mínimas, bucket em JS (evita $queryRaw)
			prisma.uploadHistory.findMany({
				where: { uploadedAt: { gte: windowStart } },
				select: { uploadedAt: true, uploadType: true },
			}),
			prisma.preOrder.findMany({
				where: { createdAt: { gte: windowStart } },
				select: { createdAt: true },
			}),
			// Breakdown "Listas ativas": fornecedores com lista vigente.
			prisma.uploadHistory.groupBy({
				by: ["companyId"],
				where: { isActive: true, uploadType: "SUPPLIER_PRODUCTS" },
			}),
			// Produtos do catálogo vigente + valor (Σ preço unitário).
			prisma.product.count({ where: { isActive: true, deletedAt: null } }),
			prisma.product.aggregate({
				_sum: { price: true },
				where: { isActive: true, deletedAt: null },
			}),
			// Breakdown "Pré-pedidos aguardando resposta" (status ACTIVE).
			prisma.preOrder.groupBy({
				by: ["clientId"],
				where: { status: "ACTIVE" },
			}),
			prisma.preOrder.groupBy({
				by: ["supplierId"],
				where: { status: "ACTIVE" },
			}),
			prisma.preOrderItem.count({ where: { preOrder: { status: "ACTIVE" } } }),
		]);

		const statusCount = (s: "ACTIVE" | "FINALIZED" | "REJECTED") =>
			preOrdersByStatus.find((p) => p.status === s)?._count.status || 0;
		const finalized = statusCount("FINALIZED");
		const rejected = statusCount("REJECTED");
		const active = statusCount("ACTIVE");

		// Representantes ligados (RepresentativeSupplier) aos fornecedores que têm
		// lista vigente — UploadHistory não registra o usuário que subiu a lista.
		const activeListSupplierIds = new Set(
			activeListSuppliers.map((r) => r.companyId),
		);
		const activeListReps = new Set(
			repLinks
				.filter((l) => activeListSupplierIds.has(l.supplierCompanyId))
				.map((l) => l.representativeId),
		).size;

		// Top representantes — valor finalizado por empresa fornecedora reatribuído
		// a cada representante que a representa (RepresentativeSupplier é N–N).
		const valueBySupplier = new Map(
			finalizedBySupplier.map((r) => [
				r.supplierId,
				Number(r._sum.totalAmount) || 0,
			]),
		);
		const repAgg = new Map<string, { name: string; value: number }>();
		for (const link of repLinks) {
			const supplierValue = valueBySupplier.get(link.supplierCompanyId) || 0;
			if (supplierValue === 0) continue;
			const entry = repAgg.get(link.representativeId) ?? {
				name: link.representative?.name || "Representante",
				value: 0,
			};
			entry.value += supplierValue;
			repAgg.set(link.representativeId, entry);
		}
		const topRepresentatives = [...repAgg.entries()]
			.map(([representativeId, v]) => ({
				representativeId,
				name: v.name,
				finalizedValue: v.value,
			}))
			.sort((a, b) => b.finalizedValue - a.finalizedValue)
			.slice(0, LEADERBOARD_SIZE);

		// Top clientes — batch-load de nomes (evita N+1).
		const clientIds = [...new Set(topClientsRaw.map((r) => r.clientId))];
		const clientCompanies = clientIds.length
			? await prisma.company.findMany({
					where: { id: { in: clientIds } },
					select: { id: true, name: true },
				})
			: [];
		const clientNameById = new Map(clientCompanies.map((c) => [c.id, c.name]));
		const topClients = topClientsRaw.map((r) => ({
			companyId: r.clientId,
			name: clientNameById.get(r.clientId) || "Empresa não encontrada",
			spend: Number(r._sum.totalAmount) || 0,
		}));

		// Matches por tipo
		const typeCount = (t: "SKU" | "CODE" | "NAME" | "MANUAL") =>
			matchesByType.find((m) => m.matchType === t)?._count.matchType || 0;

		// Tendência — pré-preenche todos os dias da janela (sem buracos no gráfico).
		const trendMap = new Map<
			string,
			{ repUploads: number; clientUploads: number; preOrders: number }
		>();
		for (let i = 0; i < TREND_DAYS; i++) {
			const d = new Date(windowStart.getTime() + i * 86_400_000);
			trendMap.set(dayKey(d), {
				repUploads: 0,
				clientUploads: 0,
				preOrders: 0,
			});
		}
		for (const row of uploadRows) {
			const b = trendMap.get(dayKey(row.uploadedAt));
			if (!b) continue;
			if (row.uploadType === "SUPPLIER_PRODUCTS") b.repUploads += 1;
			else if (row.uploadType === "CLIENT_REQUIREMENTS") b.clientUploads += 1;
		}
		for (const row of preOrderRows) {
			const b = trendMap.get(dayKey(row.createdAt));
			if (b) b.preOrders += 1;
		}
		const trend = [...trendMap.entries()].map(([date, v]) => ({ date, ...v }));

		const totalProducts = comparisonTotals._sum.totalProducts || 0;
		const matchedProducts = comparisonTotals._sum.matchedProducts || 0;

		// Economia = Σ max(0, baseline − preço) × qtd, só itens finalizados com baseline.
		let finalizedSavings = 0;
		for (const item of savingsItems) {
			const baseline = item.baselinePrice ?? 0;
			const delta = baseline - item.price;
			if (delta > 0) finalizedSavings += delta * item.quantity;
		}

		const insights = {
			funnel: {
				requirementUploads,
				comparisons,
				preOrdersCreated,
				preOrdersFinalized: finalized,
			},
			trend,
			gmv: {
				totalPreOrderValue: Number(gmvTotal._sum.totalAmount) || 0,
				finalizedValue: Number(gmvFinalized._sum.totalAmount) || 0,
				openValue: Number(gmvOpen._sum.totalAmount) || 0,
				approvalRatePct: pct(finalized, finalized + rejected),
			},
			savings: {
				finalizedSavings,
				itemsWithBaseline: savingsItems.length,
			},
			matching: {
				totalProducts,
				matchedProducts,
				matchRatePct: pct(matchedProducts, totalProducts),
				byType: {
					SKU: typeCount("SKU"),
					CODE: typeCount("CODE"),
					NAME: typeCount("NAME"),
					MANUAL: typeCount("MANUAL"),
				},
				lowConfidenceCount,
			},
			attention: {
				pendingLinkRequests,
				agingLinkRequests,
				activePreOrders: active,
				listsBreakdown: {
					representatives: activeListReps,
					suppliers: activeListSuppliers.length,
					products: activeCatalogCount,
					totalValue: Number(activeCatalogValue._sum.price) || 0,
				},
				preOrdersBreakdown: {
					clients: activePoClients.length,
					suppliers: activePoSuppliers.length,
					products: activePoItems,
					totalValue: Number(gmvOpen._sum.totalAmount) || 0,
				},
			},
			leaderboards: { topRepresentatives, topClients },
			uploadHealth: {
				total: uploadsTotal,
				failed: uploadsFailed,
				failedRatePct: pct(uploadsFailed, uploadsTotal),
				totalErrorRows: errorRowsAgg._sum.errorRows || 0,
			},
		};

		return NextResponse.json({
			success: true,
			insights,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Admin dashboard insights error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
