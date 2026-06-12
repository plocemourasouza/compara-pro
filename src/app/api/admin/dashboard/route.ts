import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET() {
	try {
		await requireAuth(["ADMIN"]);

		// Métricas de usuários por ÁREA (= company.type; admin = sem empresa).
		const [
			totalUsers,
			activeUsers,
			adminActive,
			adminTotal,
			repActive,
			repTotal,
			cliActive,
			cliTotal,
		] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { deletedAt: null } }),
			prisma.user.count({ where: { companyId: null, deletedAt: null } }),
			prisma.user.count({ where: { companyId: null } }),
			prisma.user.count({
				where: { company: { type: "REPRESENTATIVE" }, deletedAt: null },
			}),
			prisma.user.count({ where: { company: { type: "REPRESENTATIVE" } } }),
			prisma.user.count({
				where: { company: { type: "CLIENT" }, deletedAt: null },
			}),
			prisma.user.count({ where: { company: { type: "CLIENT" } } }),
		]);

		const stat = (active: number, total: number) => ({
			total,
			active,
			inactive: total - active,
		});

		const usersMetrics = {
			total: totalUsers,
			active: activeUsers,
			inactive: totalUsers - activeUsers,
			byRole: {
				admin: adminActive,
				supplier: repActive,
				client: cliActive,
			},
			roleBreakdown: {
				admin: stat(adminActive, adminTotal),
				supplier: stat(repActive, repTotal),
				client: stat(cliActive, cliTotal),
			},
		};

		// Buscar métricas de empresas
		const [totalCompanies, companiesByType] = await Promise.all([
			prisma.company.count(),
			prisma.company.groupBy({
				by: ["type"],
				_count: { type: true },
			}),
		]);

		const companiesMetrics = {
			total: totalCompanies,
			suppliers:
				companiesByType.find((c) => c.type === "SUPPLIER")?._count.type || 0,
			clients:
				companiesByType.find((c) => c.type === "CLIENT")?._count.type || 0,
		};

		// Buscar métricas de uploads
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

		const [
			totalUploads,
			uploadsToday,
			uploadsThisWeek,
			uploadsThisMonth,
			uploadsByStatus,
			activeLists,
			uploadsTodaySupplier,
			uploadsTodayClient,
		] = await Promise.all([
			prisma.uploadHistory.count(),
			prisma.uploadHistory.count({ where: { uploadedAt: { gte: today } } }),
			prisma.uploadHistory.count({ where: { uploadedAt: { gte: thisWeek } } }),
			prisma.uploadHistory.count({ where: { uploadedAt: { gte: thisMonth } } }),
			prisma.uploadHistory.groupBy({
				by: ["status"],
				_count: { status: true },
			}),
			// Listas de fornecedor ativas (1 por fornecedor — a anterior é inativada).
			prisma.uploadHistory.count({
				where: { isActive: true, uploadType: "SUPPLIER_PRODUCTS" },
			}),
			// Uploads de hoje por tipo (representante = SUPPLIER_PRODUCTS, cliente = CLIENT_REQUIREMENTS).
			prisma.uploadHistory.count({
				where: { uploadedAt: { gte: today }, uploadType: "SUPPLIER_PRODUCTS" },
			}),
			prisma.uploadHistory.count({
				where: {
					uploadedAt: { gte: today },
					uploadType: "CLIENT_REQUIREMENTS",
				},
			}),
		]);

		const uploadsMetrics = {
			total: totalUploads,
			today: uploadsToday,
			todayByType: {
				representatives: uploadsTodaySupplier,
				clients: uploadsTodayClient,
			},
			thisWeek: uploadsThisWeek,
			thisMonth: uploadsThisMonth,
			activeLists,
			byStatus: {
				success:
					uploadsByStatus.find((u) => u.status === "COMPLETED")?._count
						.status || 0,
				processing:
					uploadsByStatus.find((u) => u.status === "PROCESSING")?._count
						.status || 0,
				failed:
					uploadsByStatus.find((u) => u.status === "FAILED")?._count.status ||
					0,
			},
		};

		// Buscar métricas de pré-pedidos
		const [preOrderStats, preOrdersByStatus] = await Promise.all([
			prisma.preOrder.aggregate({
				_count: { id: true },
				_sum: { totalAmount: true },
			}),
			prisma.preOrder.groupBy({
				by: ["status"],
				_count: { status: true },
			}),
		]);

		const preOrdersMetrics = {
			total: preOrderStats._count?.id || 0,
			pending:
				preOrdersByStatus.find((p) => p.status === "ACTIVE")?._count.status ||
				0,
			approved:
				preOrdersByStatus.find((p) => p.status === "FINALIZED")?._count
					.status || 0,
			rejected:
				preOrdersByStatus.find((p) => p.status === "REJECTED")?._count.status ||
				0,
			totalValue: Number(preOrderStats._sum?.totalAmount) || 0,
		};

		// Top 3 produtos em pré-pedidos por valor acumulado
		const topProductsInPreOrders = await prisma.preOrderItem.groupBy({
			by: ["matchId"],
			_sum: { totalPrice: true },
			orderBy: { _sum: { totalPrice: "desc" } },
			take: 3,
		});

		// Detalhes dos produtos — batch load (evita N+1)
		const matchIds = topProductsInPreOrders
			.map((item) => item.matchId)
			.filter((id): id is string => id !== null);
		const matches = matchIds.length
			? await prisma.comparisonMatch.findMany({
					where: { id: { in: matchIds } },
					select: {
						id: true,
						clientProduct: { select: { name: true } },
						_count: { select: { supplierMatches: true } },
					},
				})
			: [];
		const matchById = new Map(matches.map((m) => [m.id, m]));

		const topProductsDetails = topProductsInPreOrders.map((item) => {
			const match = item.matchId ? matchById.get(item.matchId) : undefined;
			return {
				matchId: item.matchId,
				productName: match?.clientProduct.name || "Produto não encontrado",
				totalValue: Number(item._sum.totalPrice) || 0,
				supplierCount: match?._count.supplierMatches || 0,
			};
		});

		// Top fornecedores por valor em pré-pedidos, cada coluna empilhada pelos
		// seus 10 produtos de maior valor (segmento = produto; ver SupplierBars).
		const TOP_SUPPLIERS = 6;
		const poItems = await prisma.preOrderItem.findMany({
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
		const topSuppliers = rankedTop10.map((s) => ({
			supplierId: s.id,
			name: supplierNameById.get(s.id) || "Fornecedor",
			total: s.total,
			products: s.top10.map(([mid, value]) => ({
				name: productNameByMatch.get(mid) || "Produto",
				value,
			})),
		}));

		const metrics = {
			users: usersMetrics,
			companies: companiesMetrics,
			uploads: uploadsMetrics,
			preOrders: preOrdersMetrics,
			topProductsInPreOrders: topProductsDetails,
			topSuppliers,
		};

		return NextResponse.json({
			success: true,
			metrics,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Admin dashboard metrics error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
