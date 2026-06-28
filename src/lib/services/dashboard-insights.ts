import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { calcItemSavings } from "@/lib/savings";

/**
 * Builder único dos insights de dashboard, escopado por área. ADMIN vê tudo;
 * REPRESENTATIVE vê os fornecedores que representa; CLIENT vê a própria empresa.
 * Os endpoints (/api/{admin,supplier,client}/dashboard/insights) são chamadores
 * finos: resolvem auth + escopo e delegam aqui. Uma só implementação de funil,
 * tendência, GMV, economia, matching, atenção e leaderboards.
 */

const TREND_DAYS = 30;
const LOW_CONFIDENCE = 0.7;
const AGING_DAYS = 7;
const LEADERBOARD_SIZE = 5;
const TOP_SUPPLIERS = 6;

export type InsightsScope =
	| { kind: "admin" }
	| { kind: "representative"; supplierCompanyIds: string[] }
	| { kind: "client"; clientCompanyId: string };

export interface FunnelData {
	requirementUploads: number;
	comparisons: number;
	preOrdersCreated: number;
	preOrdersFinalized: number;
}

export interface TrendPoint {
	date: string;
	repUploads: number;
	clientUploads: number;
	preOrders: number;
}

export interface GmvData {
	totalPreOrderValue: number;
	finalizedValue: number;
	openValue: number;
	approvalRatePct: number | null;
}

export interface SavingsData {
	finalizedSavings: number;
	itemsWithBaseline: number;
	/** Economia estimada a partir das comparações (só CLIENT). */
	estimatedSavings?: number;
}

export interface MatchingData {
	totalProducts: number;
	matchedProducts: number;
	matchRatePct: number | null;
	byType: { SKU: number; CODE: number; NAME: number; MANUAL: number };
	lowConfidenceCount: number;
}

export interface AttentionData {
	pendingLinkRequests: number;
	agingLinkRequests: number;
	activePreOrders: number;
	listsBreakdown: {
		representatives: number;
		suppliers: number;
		products: number;
		totalValue: number;
	};
	preOrdersBreakdown: {
		clients: number;
		suppliers: number;
		products: number;
		totalValue: number;
	};
	/** Comparações sem pré-pedido gerado (só CLIENT). */
	comparisonsNotConverted?: number;
}

export interface SupplierBarDatum {
	supplierId: string;
	name: string;
	total: number;
	products: Array<{ name: string; value: number }>;
}

export interface LeaderboardsData {
	topRepresentatives: Array<{
		representativeId: string;
		name: string;
		finalizedValue: number;
	}>;
	topClients: Array<{ companyId: string; name: string; spend: number }>;
	topSuppliers: Array<{
		supplierId: string;
		name: string;
		finalizedValue: number;
	}>;
}

export interface UploadHealthData {
	total: number;
	failed: number;
	failedRatePct: number | null;
	totalErrorRows: number;
}

export interface DashboardInsights {
	funnel: FunnelData;
	trend: TrendPoint[];
	gmv: GmvData;
	savings: SavingsData;
	matching: MatchingData;
	attention: AttentionData;
	leaderboards: LeaderboardsData;
	uploadHealth: UploadHealthData;
	supplierBars: SupplierBarDatum[];
}

/** percent helper que falha seguro para null em denominador zero (UI "—"). */
export function pct(numerator: number, denominator: number): number | null {
	if (denominator <= 0) return null;
	return Math.round((numerator / denominator) * 1000) / 10;
}

/** Chave yyyy-mm-dd em UTC (mesmo tratamento de datas do resto do app). */
export function dayKey(d: Date): string {
	return d.toISOString().slice(0, 10);
}

function trendWindow(now: Date): { windowStart: Date; agingBefore: Date } {
	const windowStart = new Date(now.getTime() - (TREND_DAYS - 1) * 86_400_000);
	windowStart.setHours(0, 0, 0, 0);
	const agingBefore = new Date(now.getTime() - AGING_DAYS * 86_400_000);
	return { windowStart, agingBefore };
}

/** Pré-preenche os 30 dias para o gráfico não ter buracos. */
function emptyTrendMap(windowStart: Date): Map<string, TrendPoint> {
	const map = new Map<string, TrendPoint>();
	for (let i = 0; i < TREND_DAYS; i++) {
		const d = new Date(windowStart.getTime() + i * 86_400_000);
		map.set(dayKey(d), {
			date: dayKey(d),
			repUploads: 0,
			clientUploads: 0,
			preOrders: 0,
		});
	}
	return map;
}

function emptyAttention(): AttentionData {
	return {
		pendingLinkRequests: 0,
		agingLinkRequests: 0,
		activePreOrders: 0,
		listsBreakdown: {
			representatives: 0,
			suppliers: 0,
			products: 0,
			totalValue: 0,
		},
		preOrdersBreakdown: {
			clients: 0,
			suppliers: 0,
			products: 0,
			totalValue: 0,
		},
	};
}

function emptyLeaderboards(): LeaderboardsData {
	return { topRepresentatives: [], topClients: [], topSuppliers: [] };
}

/** Reduz itens finalizados (baseline − preço) × qtd via helper único de economia. */
function sumFinalizedSavings(
	items: Array<{
		baselinePrice: number | null;
		price: number;
		quantity: number;
	}>,
): number {
	let total = 0;
	for (const item of items) {
		total += calcItemSavings(item.baselinePrice, item.price, item.quantity);
	}
	return total;
}

/** Barras de fornecedor: top N por valor finalizado, empilhados pelos 10 produtos
 * de maior valor. `supplierFilter` escopa por preOrder.supplierId (rep). */
async function buildSupplierBars(
	supplierFilter?: Prisma.PreOrderWhereInput,
): Promise<SupplierBarDatum[]> {
	const poItems = await prisma.preOrderItem.findMany({
		where: supplierFilter ? { preOrder: supplierFilter } : undefined,
		select: {
			totalPrice: true,
			matchId: true,
			preOrder: { select: { supplierId: true } },
		},
	});
	const bySupplier = new Map<
		string,
		{ total: number; products: Map<string, number> }
	>();
	for (const it of poItems) {
		const sid = it.preOrder.supplierId;
		const val = Number(it.totalPrice) || 0;
		if (val === 0) continue;
		const entry = bySupplier.get(sid) ?? { total: 0, products: new Map() };
		entry.total += val;
		const key = it.matchId ?? "__none__";
		entry.products.set(key, (entry.products.get(key) ?? 0) + val);
		bySupplier.set(sid, entry);
	}
	const rankedSuppliers = [...bySupplier.entries()]
		.sort((a, b) => b[1].total - a[1].total)
		.slice(0, TOP_SUPPLIERS);
	const supplierTopMatches = new Set<string>();
	const rankedTop10 = rankedSuppliers.map(([id, agg]) => {
		const top10 = [...agg.products.entries()]
			.filter(([k]) => k !== "__none__")
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10);
		for (const [mid] of top10) supplierTopMatches.add(mid);
		return { id, total: agg.total, top10 };
	});
	const [supplierCompanies, supplierMatches] = await Promise.all([
		rankedSuppliers.length
			? prisma.company.findMany({
					where: { id: { in: rankedSuppliers.map(([id]) => id) } },
					select: { id: true, name: true },
				})
			: Promise.resolve([] as { id: string; name: string }[]),
		supplierTopMatches.size
			? prisma.comparisonMatch.findMany({
					where: { id: { in: [...supplierTopMatches] } },
					select: { id: true, clientProduct: { select: { name: true } } },
				})
			: Promise.resolve(
					[] as { id: string; clientProduct: { name: string } }[],
				),
	]);
	const supplierNameById = new Map(
		supplierCompanies.map((c) => [c.id, c.name]),
	);
	const productNameByMatch = new Map(
		supplierMatches.map((m) => [m.id, m.clientProduct.name]),
	);
	return rankedTop10.map((s) => ({
		supplierId: s.id,
		name: supplierNameById.get(s.id) || "Fornecedor",
		total: s.total,
		products: s.top10.map(([mid, value]) => ({
			name: productNameByMatch.get(mid) || "Produto",
			value,
		})),
	}));
}

export async function buildDashboardInsights(
	scope: InsightsScope,
): Promise<DashboardInsights> {
	if (scope.kind === "admin") return buildAdminInsights();
	if (scope.kind === "representative") {
		return buildRepresentativeInsights(scope.supplierCompanyIds);
	}
	return buildClientInsights(scope.clientCompanyId);
}

// ───────────────────────────── ADMIN (paridade) ────────────────────────────

async function buildAdminInsights(): Promise<DashboardInsights> {
	const now = new Date();
	const { windowStart, agingBefore } = trendWindow(now);

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
		prisma.uploadHistory.count({
			where: { uploadType: "CLIENT_REQUIREMENTS" },
		}),
		prisma.comparison.count(),
		prisma.preOrder.count(),
		prisma.preOrder.groupBy({ by: ["status"], _count: { status: true } }),
		prisma.preOrder.aggregate({ _sum: { totalAmount: true } }),
		prisma.preOrder.aggregate({
			_sum: { totalAmount: true },
			where: { status: "FINALIZED" },
		}),
		prisma.preOrder.aggregate({
			_sum: { totalAmount: true },
			where: { status: "ACTIVE" },
		}),
		prisma.preOrderItem.findMany({
			where: {
				preOrder: { status: "FINALIZED" },
				baselinePrice: { not: null },
			},
			select: { baselinePrice: true, price: true, quantity: true },
		}),
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
		prisma.supplierLinkRequest.count({ where: { status: "PENDING" } }),
		prisma.supplierLinkRequest.count({
			where: { status: "PENDING", createdAt: { lt: agingBefore } },
		}),
		prisma.preOrder.groupBy({
			by: ["supplierId"],
			_sum: { totalAmount: true },
			where: { status: "FINALIZED" },
		}),
		prisma.representativeSupplier.findMany({
			select: {
				representativeCompanyId: true,
				supplierCompanyId: true,
				representativeCompany: { select: { name: true } },
			},
		}),
		prisma.preOrder.groupBy({
			by: ["clientId"],
			_sum: { totalAmount: true },
			where: { status: "FINALIZED" },
			orderBy: { _sum: { totalAmount: "desc" } },
			take: LEADERBOARD_SIZE,
		}),
		prisma.uploadHistory.count(),
		prisma.uploadHistory.count({ where: { status: "FAILED" } }),
		prisma.uploadHistory.aggregate({ _sum: { errorRows: true } }),
		prisma.uploadHistory.findMany({
			where: { uploadedAt: { gte: windowStart } },
			select: { uploadedAt: true, uploadType: true },
		}),
		prisma.preOrder.findMany({
			where: { createdAt: { gte: windowStart } },
			select: { createdAt: true },
		}),
		prisma.uploadHistory.groupBy({
			by: ["companyId"],
			where: { isActive: true, uploadType: "SUPPLIER_PRODUCTS" },
		}),
		prisma.product.count({ where: { isActive: true, deletedAt: null } }),
		prisma.product.aggregate({
			_sum: { price: true },
			where: { isActive: true, deletedAt: null },
		}),
		prisma.preOrder.groupBy({ by: ["clientId"], where: { status: "ACTIVE" } }),
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

	const activeListSupplierIds = new Set(
		activeListSuppliers.map((r) => r.companyId),
	);
	const activeListReps = new Set(
		repLinks
			.filter((l) => activeListSupplierIds.has(l.supplierCompanyId))
			.map((l) => l.representativeCompanyId),
	).size;

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
		const entry = repAgg.get(link.representativeCompanyId) ?? {
			name: link.representativeCompany?.name || "Representante",
			value: 0,
		};
		entry.value += supplierValue;
		repAgg.set(link.representativeCompanyId, entry);
	}
	const topRepresentatives = [...repAgg.entries()]
		.map(([representativeId, v]) => ({
			representativeId,
			name: v.name,
			finalizedValue: v.value,
		}))
		.sort((a, b) => b.finalizedValue - a.finalizedValue)
		.slice(0, LEADERBOARD_SIZE);

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

	const typeCount = (t: "SKU" | "CODE" | "NAME" | "MANUAL") =>
		matchesByType.find((m) => m.matchType === t)?._count.matchType || 0;

	const trendMap = emptyTrendMap(windowStart);
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
	const trend = [...trendMap.values()];

	const totalProducts = comparisonTotals._sum.totalProducts || 0;
	const matchedProducts = comparisonTotals._sum.matchedProducts || 0;
	const finalizedSavings = sumFinalizedSavings(savingsItems);

	return {
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
		savings: { finalizedSavings, itemsWithBaseline: savingsItems.length },
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
		leaderboards: { topRepresentatives, topClients, topSuppliers: [] },
		uploadHealth: {
			total: uploadsTotal,
			failed: uploadsFailed,
			failedRatePct: pct(uploadsFailed, uploadsTotal),
			totalErrorRows: errorRowsAgg._sum.errorRows || 0,
		},
		supplierBars: [],
	};
}

// ───────────────────────────── REPRESENTANTE ────────────────────────────────

async function buildRepresentativeInsights(
	ids: string[],
): Promise<DashboardInsights> {
	if (ids.length === 0) return zeroedInsights();

	const now = new Date();
	const { windowStart, agingBefore } = trendWindow(now);
	const supplierWhere: Prisma.PreOrderWhereInput = { supplierId: { in: ids } };
	const matchReach: Prisma.ComparisonMatchWhereInput = {
		supplierMatches: {
			some: { supplierCompanyId: { in: ids }, isActive: true },
		},
	};

	const [
		catalogUploads,
		comparisons,
		preOrdersCreated,
		preOrdersByStatus,
		gmvTotal,
		gmvFinalized,
		gmvOpen,
		savingsItems,
		reachableMatches,
		matchesByType,
		lowConfidenceCount,
		pendingLinkRequests,
		agingLinkRequests,
		topSuppliersRaw,
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
		supplierBars,
	] = await Promise.all([
		prisma.uploadHistory.count({
			where: { companyId: { in: ids }, uploadType: "SUPPLIER_PRODUCTS" },
		}),
		prisma.comparison.count({
			where: { matches: { some: matchReach } },
		}),
		prisma.preOrder.count({ where: supplierWhere }),
		prisma.preOrder.groupBy({
			by: ["status"],
			_count: { status: true },
			where: supplierWhere,
		}),
		prisma.preOrder.aggregate({
			_sum: { totalAmount: true },
			where: supplierWhere,
		}),
		prisma.preOrder.aggregate({
			_sum: { totalAmount: true },
			where: { ...supplierWhere, status: "FINALIZED" },
		}),
		prisma.preOrder.aggregate({
			_sum: { totalAmount: true },
			where: { ...supplierWhere, status: "ACTIVE" },
		}),
		prisma.preOrderItem.findMany({
			where: {
				preOrder: { ...supplierWhere, status: "FINALIZED" },
				baselinePrice: { not: null },
				deletedAt: null,
			},
			select: { baselinePrice: true, price: true, quantity: true },
		}),
		prisma.comparisonMatch.count({ where: matchReach }),
		prisma.comparisonMatch.groupBy({
			by: ["matchType"],
			_count: { matchType: true },
			where: matchReach,
		}),
		prisma.comparisonMatch.count({
			where: { ...matchReach, confidence: { lt: LOW_CONFIDENCE } },
		}),
		prisma.supplierLinkRequest.count({
			where: { supplierCompanyId: { in: ids }, status: "PENDING" },
		}),
		prisma.supplierLinkRequest.count({
			where: {
				supplierCompanyId: { in: ids },
				status: "PENDING",
				createdAt: { lt: agingBefore },
			},
		}),
		prisma.preOrder.groupBy({
			by: ["supplierId"],
			_sum: { totalAmount: true },
			where: { ...supplierWhere, status: "FINALIZED" },
			orderBy: { _sum: { totalAmount: "desc" } },
			take: LEADERBOARD_SIZE,
		}),
		prisma.preOrder.groupBy({
			by: ["clientId"],
			_sum: { totalAmount: true },
			where: { ...supplierWhere, status: "FINALIZED" },
			orderBy: { _sum: { totalAmount: "desc" } },
			take: LEADERBOARD_SIZE,
		}),
		prisma.uploadHistory.count({ where: { companyId: { in: ids } } }),
		prisma.uploadHistory.count({
			where: { companyId: { in: ids }, status: "FAILED" },
		}),
		prisma.uploadHistory.aggregate({
			_sum: { errorRows: true },
			where: { companyId: { in: ids } },
		}),
		prisma.uploadHistory.findMany({
			where: { companyId: { in: ids }, uploadedAt: { gte: windowStart } },
			select: { uploadedAt: true, uploadType: true },
		}),
		prisma.preOrder.findMany({
			where: { ...supplierWhere, createdAt: { gte: windowStart } },
			select: { createdAt: true },
		}),
		prisma.uploadHistory.groupBy({
			by: ["companyId"],
			where: {
				companyId: { in: ids },
				isActive: true,
				uploadType: "SUPPLIER_PRODUCTS",
			},
		}),
		prisma.product.count({
			where: { companyId: { in: ids }, isActive: true, deletedAt: null },
		}),
		prisma.product.aggregate({
			_sum: { price: true },
			where: { companyId: { in: ids }, isActive: true, deletedAt: null },
		}),
		prisma.preOrder.groupBy({
			by: ["clientId"],
			where: { ...supplierWhere, status: "ACTIVE" },
		}),
		prisma.preOrder.groupBy({
			by: ["supplierId"],
			where: { ...supplierWhere, status: "ACTIVE" },
		}),
		prisma.preOrderItem.count({
			where: { preOrder: { ...supplierWhere, status: "ACTIVE" } },
		}),
		buildSupplierBars(supplierWhere),
	]);

	const statusCount = (s: "ACTIVE" | "FINALIZED" | "REJECTED") =>
		preOrdersByStatus.find((p) => p.status === s)?._count.status || 0;
	const finalized = statusCount("FINALIZED");
	const rejected = statusCount("REJECTED");
	const active = statusCount("ACTIVE");

	const typeCount = (t: "SKU" | "CODE" | "NAME" | "MANUAL") =>
		matchesByType.find((m) => m.matchType === t)?._count.matchType || 0;

	const trendMap = emptyTrendMap(windowStart);
	for (const row of uploadRows) {
		const b = trendMap.get(dayKey(row.uploadedAt));
		if (b && row.uploadType === "SUPPLIER_PRODUCTS") b.repUploads += 1;
	}
	for (const row of preOrderRows) {
		const b = trendMap.get(dayKey(row.createdAt));
		if (b) b.preOrders += 1;
	}

	const finalizedSavings = sumFinalizedSavings(savingsItems);

	// Nomes (batch) para leaderboards de fornecedores + clientes.
	const supplierIds = topSuppliersRaw.map((r) => r.supplierId);
	const clientIds = topClientsRaw.map((r) => r.clientId);
	const allIds = [...new Set([...supplierIds, ...clientIds])];
	const companies = allIds.length
		? await prisma.company.findMany({
				where: { id: { in: allIds } },
				select: { id: true, name: true },
			})
		: [];
	const nameById = new Map(companies.map((c) => [c.id, c.name]));

	return {
		funnel: {
			requirementUploads: catalogUploads,
			comparisons,
			preOrdersCreated,
			preOrdersFinalized: finalized,
		},
		trend: [...trendMap.values()],
		gmv: {
			totalPreOrderValue: Number(gmvTotal._sum.totalAmount) || 0,
			finalizedValue: Number(gmvFinalized._sum.totalAmount) || 0,
			openValue: Number(gmvOpen._sum.totalAmount) || 0,
			approvalRatePct: pct(finalized, finalized + rejected),
		},
		savings: { finalizedSavings, itemsWithBaseline: savingsItems.length },
		matching: {
			// Sem denominador global honesto sem vazar outros fornecedores → null.
			totalProducts: reachableMatches,
			matchedProducts: reachableMatches,
			matchRatePct: null,
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
				representatives: 0,
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
		leaderboards: {
			topRepresentatives: [],
			topClients: topClientsRaw.map((r) => ({
				companyId: r.clientId,
				name: nameById.get(r.clientId) || "Empresa não encontrada",
				spend: Number(r._sum.totalAmount) || 0,
			})),
			topSuppliers: topSuppliersRaw.map((r) => ({
				supplierId: r.supplierId,
				name: nameById.get(r.supplierId) || "Fornecedor",
				finalizedValue: Number(r._sum.totalAmount) || 0,
			})),
		},
		uploadHealth: {
			total: uploadsTotal,
			failed: uploadsFailed,
			failedRatePct: pct(uploadsFailed, uploadsTotal),
			totalErrorRows: errorRowsAgg._sum.errorRows || 0,
		},
		supplierBars,
	};
}

// ───────────────────────────────── CLIENTE ──────────────────────────────────

async function buildClientInsights(cid: string): Promise<DashboardInsights> {
	if (!cid) return zeroedInsights();

	const now = new Date();
	const { windowStart } = trendWindow(now);
	const clientWhere: Prisma.PreOrderWhereInput = { clientId: cid };
	const comparisonWhere: Prisma.ComparisonWhereInput = { clientId: cid };

	const [
		requirementUploads,
		comparisons,
		preOrdersCreated,
		preOrdersByStatus,
		gmvTotal,
		gmvFinalized,
		gmvOpen,
		savingsItems,
		estimatedRows,
		comparisonTotals,
		matchesByType,
		lowConfidenceCount,
		pendingLinkRequests,
		comparisonsNotConverted,
		topSuppliersRaw,
		uploadsTotal,
		uploadsFailed,
		errorRowsAgg,
		uploadRows,
		preOrderRows,
	] = await Promise.all([
		prisma.uploadHistory.count({
			where: { companyId: cid, uploadType: "CLIENT_REQUIREMENTS" },
		}),
		prisma.comparison.count({ where: comparisonWhere }),
		prisma.preOrder.count({ where: clientWhere }),
		prisma.preOrder.groupBy({
			by: ["status"],
			_count: { status: true },
			where: clientWhere,
		}),
		prisma.preOrder.aggregate({
			_sum: { totalAmount: true },
			where: clientWhere,
		}),
		prisma.preOrder.aggregate({
			_sum: { totalAmount: true },
			where: { ...clientWhere, status: "FINALIZED" },
		}),
		prisma.preOrder.aggregate({
			_sum: { totalAmount: true },
			where: { ...clientWhere, status: "ACTIVE" },
		}),
		prisma.preOrderItem.findMany({
			where: {
				preOrder: { ...clientWhere, status: "FINALIZED" },
				baselinePrice: { not: null },
				deletedAt: null,
			},
			select: { baselinePrice: true, price: true, quantity: true },
		}),
		prisma.comparison.findMany({
			where: { ...comparisonWhere, previousTotal: { not: null } },
			select: { previousTotal: true, bestPriceTotal: true },
		}),
		prisma.comparison.aggregate({
			_sum: { totalProducts: true, matchedProducts: true },
			where: comparisonWhere,
		}),
		prisma.comparisonMatch.groupBy({
			by: ["matchType"],
			_count: { matchType: true },
			where: { comparison: comparisonWhere },
		}),
		prisma.comparisonMatch.count({
			where: {
				comparison: comparisonWhere,
				confidence: { lt: LOW_CONFIDENCE },
			},
		}),
		prisma.supplierLinkRequest.count({
			where: { clientCompanyId: cid, status: "PENDING" },
		}),
		prisma.comparison.count({
			where: { ...comparisonWhere, preOrders: { none: {} } },
		}),
		prisma.preOrder.groupBy({
			by: ["supplierId"],
			_sum: { totalAmount: true },
			where: { ...clientWhere, status: "FINALIZED" },
			orderBy: { _sum: { totalAmount: "desc" } },
			take: LEADERBOARD_SIZE,
		}),
		prisma.uploadHistory.count({ where: { companyId: cid } }),
		prisma.uploadHistory.count({ where: { companyId: cid, status: "FAILED" } }),
		prisma.uploadHistory.aggregate({
			_sum: { errorRows: true },
			where: { companyId: cid },
		}),
		prisma.uploadHistory.findMany({
			where: { companyId: cid, uploadedAt: { gte: windowStart } },
			select: { uploadedAt: true, uploadType: true },
		}),
		prisma.preOrder.findMany({
			where: { ...clientWhere, createdAt: { gte: windowStart } },
			select: { createdAt: true },
		}),
	]);

	const statusCount = (s: "ACTIVE" | "FINALIZED" | "REJECTED") =>
		preOrdersByStatus.find((p) => p.status === s)?._count.status || 0;
	const finalized = statusCount("FINALIZED");
	const rejected = statusCount("REJECTED");
	const active = statusCount("ACTIVE");

	const typeCount = (t: "SKU" | "CODE" | "NAME" | "MANUAL") =>
		matchesByType.find((m) => m.matchType === t)?._count.matchType || 0;

	const trendMap = emptyTrendMap(windowStart);
	for (const row of uploadRows) {
		const b = trendMap.get(dayKey(row.uploadedAt));
		if (b && row.uploadType === "CLIENT_REQUIREMENTS") b.clientUploads += 1;
	}
	for (const row of preOrderRows) {
		const b = trendMap.get(dayKey(row.createdAt));
		if (b) b.preOrders += 1;
	}

	const finalizedSavings = sumFinalizedSavings(savingsItems);
	const estimatedSavings = estimatedRows.reduce(
		(sum, c) =>
			sum + Math.max(0, (c.previousTotal ?? 0) - (c.bestPriceTotal ?? 0)),
		0,
	);

	const totalProducts = comparisonTotals._sum.totalProducts || 0;
	const matchedProducts = comparisonTotals._sum.matchedProducts || 0;

	const supplierIds = topSuppliersRaw.map((r) => r.supplierId);
	const companies = supplierIds.length
		? await prisma.company.findMany({
				where: { id: { in: supplierIds } },
				select: { id: true, name: true },
			})
		: [];
	const nameById = new Map(companies.map((c) => [c.id, c.name]));

	const attention = emptyAttention();
	attention.pendingLinkRequests = pendingLinkRequests;
	attention.activePreOrders = active;
	attention.comparisonsNotConverted = comparisonsNotConverted;

	return {
		funnel: {
			requirementUploads,
			comparisons,
			preOrdersCreated,
			preOrdersFinalized: finalized,
		},
		trend: [...trendMap.values()],
		gmv: {
			totalPreOrderValue: Number(gmvTotal._sum.totalAmount) || 0,
			finalizedValue: Number(gmvFinalized._sum.totalAmount) || 0,
			openValue: Number(gmvOpen._sum.totalAmount) || 0,
			approvalRatePct: pct(finalized, finalized + rejected),
		},
		savings: {
			finalizedSavings,
			itemsWithBaseline: savingsItems.length,
			estimatedSavings,
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
		attention,
		leaderboards: {
			topRepresentatives: [],
			topClients: [],
			topSuppliers: topSuppliersRaw.map((r) => ({
				supplierId: r.supplierId,
				name: nameById.get(r.supplierId) || "Fornecedor",
				finalizedValue: Number(r._sum.totalAmount) || 0,
			})),
		},
		uploadHealth: {
			total: uploadsTotal,
			failed: uploadsFailed,
			failedRatePct: pct(uploadsFailed, uploadsTotal),
			totalErrorRows: errorRowsAgg._sum.errorRows || 0,
		},
		supplierBars: [],
	};
}

/** Insights zerados para escopo vazio (rep sem carteira / cliente sem empresa). */
function zeroedInsights(): DashboardInsights {
	const { windowStart } = trendWindow(new Date());
	return {
		funnel: {
			requirementUploads: 0,
			comparisons: 0,
			preOrdersCreated: 0,
			preOrdersFinalized: 0,
		},
		trend: [...emptyTrendMap(windowStart).values()],
		gmv: {
			totalPreOrderValue: 0,
			finalizedValue: 0,
			openValue: 0,
			approvalRatePct: null,
		},
		savings: { finalizedSavings: 0, itemsWithBaseline: 0, estimatedSavings: 0 },
		matching: {
			totalProducts: 0,
			matchedProducts: 0,
			matchRatePct: null,
			byType: { SKU: 0, CODE: 0, NAME: 0, MANUAL: 0 },
			lowConfidenceCount: 0,
		},
		attention: emptyAttention(),
		leaderboards: emptyLeaderboards(),
		uploadHealth: {
			total: 0,
			failed: 0,
			failedRatePct: null,
			totalErrorRows: 0,
		},
		supplierBars: [],
	};
}
