import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET() {
	try {
		await requireAuth(["ADMIN"]);

		// Buscar métricas de usuários
		const [totalUsers, activeUsers, usersByRole] = await Promise.all([
			prisma.user.count(),
			prisma.user.count({ where: { deletedAt: null } }),
			prisma.user.groupBy({
				by: ["role"],
				_count: { role: true },
				where: { deletedAt: null },
			}),
		]);

		const usersMetrics = {
			total: totalUsers,
			active: activeUsers,
			inactive: totalUsers - activeUsers,
			byRole: {
				admin: usersByRole.find((u) => u.role === "ADMIN")?._count.role || 0,
				supplier:
					usersByRole.find((u) => u.role === "SUPPLIER")?._count.role || 0,
				client: usersByRole.find((u) => u.role === "CLIENT")?._count.role || 0,
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
		] = await Promise.all([
			prisma.uploadHistory.count(),
			prisma.uploadHistory.count({ where: { uploadedAt: { gte: today } } }),
			prisma.uploadHistory.count({ where: { uploadedAt: { gte: thisWeek } } }),
			prisma.uploadHistory.count({ where: { uploadedAt: { gte: thisMonth } } }),
			prisma.uploadHistory.groupBy({
				by: ["status"],
				_count: { status: true },
			}),
		]);

		const uploadsMetrics = {
			total: totalUploads,
			today: uploadsToday,
			thisWeek: uploadsThisWeek,
			thisMonth: uploadsThisMonth,
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

		const metrics = {
			users: usersMetrics,
			companies: companiesMetrics,
			uploads: uploadsMetrics,
			preOrders: preOrdersMetrics,
			topProductsInPreOrders: topProductsDetails,
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
