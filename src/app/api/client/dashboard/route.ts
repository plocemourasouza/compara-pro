import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET() {
	try {
		const user = await requireAuth(["CLIENT", "ADMIN"]);
		const companyId = user.company?.id;

		if (!companyId) {
			return NextResponse.json({
				success: true,
				metrics: {
					demands: 0,
					comparisons: 0,
					preOrders: { pending: 0, approved: 0, rejected: 0, totalValue: 0 },
					estimatedSavings: 0,
					suppliers: 0,
					recentPreOrders: [],
					desk: null,
					waitingOrders: [],
				},
			});
		}

		const [
			demands,
			comparisons,
			savingsRows,
			preOrdersByStatus,
			approvedSum,
			suppliersCount,
			recent,
			latestComparison,
			waiting,
		] = await Promise.all([
			prisma.uploadHistory.count({
				where: { companyId, uploadType: "CLIENT_REQUIREMENTS" },
			}),
			prisma.comparison.count({ where: { clientId: companyId } }),
			prisma.comparison.findMany({
				where: { clientId: companyId, previousTotal: { not: null } },
				select: { previousTotal: true, bestPriceTotal: true },
			}),
			prisma.preOrder.groupBy({
				by: ["status"],
				where: { clientId: companyId },
				_count: { status: true },
			}),
			prisma.preOrder.aggregate({
				where: { clientId: companyId, status: "FINALIZED" },
				_sum: { totalAmount: true },
			}),
			prisma.supplierClient.count({ where: { clientCompanyId: companyId } }),
			prisma.preOrder.findMany({
				where: { clientId: companyId },
				orderBy: { createdAt: "desc" },
				take: 5,
				select: {
					id: true,
					status: true,
					totalAmount: true,
					createdAt: true,
					supplier: { select: { name: true } },
				},
			}),
			prisma.comparison.findFirst({
				where: { clientId: companyId },
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					totalProducts: true,
					matchedProducts: true,
					clientUpload: { select: { fileName: true } },
					matches: {
						orderBy: { productName: "asc" },
						take: 6,
						select: {
							id: true,
							productName: true,
							supplierMatches: {
								where: { isActive: true },
								select: {
									price: true,
									supplierCompany: { select: { name: true } },
								},
							},
						},
					},
				},
			}),
			prisma.preOrder.findMany({
				where: { clientId: companyId, status: "ACTIVE" },
				orderBy: { createdAt: "desc" },
				take: 5,
				select: {
					id: true,
					totalAmount: true,
					createdAt: true,
					supplier: { select: { name: true } },
				},
			}),
		]);

		const count = (s: string) =>
			preOrdersByStatus.find((p) => p.status === s)?._count.status ?? 0;
		const estimatedSavings = savingsRows.reduce(
			(sum, c) =>
				sum + Math.max(0, (c.previousTotal ?? 0) - (c.bestPriceTotal ?? 0)),
			0,
		);

		const supplierNames = latestComparison
			? [
					...new Set(
						latestComparison.matches.flatMap((match) =>
							match.supplierMatches.map((offer) => offer.supplierCompany.name),
						),
					),
				]
			: [];

		const desk = latestComparison
			? {
					comparisonId: latestComparison.id,
					fileName: latestComparison.clientUpload.fileName,
					totalProducts: latestComparison.totalProducts,
					matchedProducts: latestComparison.matchedProducts,
					suppliers: supplierNames,
					rows: latestComparison.matches.map((match) => {
						const offers = match.supplierMatches.map((offer) => ({
							supplierName: offer.supplierCompany.name,
							price: offer.price,
						}));
						const lowest = offers.reduce<number | null>(
							(min, offer) =>
								min == null || offer.price < min ? offer.price : min,
							null,
						);
						const winner =
							lowest == null
								? null
								: (offers.find((offer) => offer.price === lowest)
										?.supplierName ?? null);
						return {
							id: match.id,
							name: match.productName,
							offers,
							winner,
						};
					}),
				}
			: null;

		return NextResponse.json({
			success: true,
			metrics: {
				demands,
				comparisons,
				preOrders: {
					pending: count("ACTIVE"),
					approved: count("FINALIZED"),
					rejected: count("REJECTED"),
					totalValue: Number(approvedSum._sum?.totalAmount) || 0,
				},
				estimatedSavings,
				suppliers: suppliersCount,
				recentPreOrders: recent.map((p) => ({
					id: p.id,
					supplierName: p.supplier.name,
					status: p.status,
					totalAmount: Number(p.totalAmount) || 0,
					createdAt: p.createdAt.toISOString(),
				})),
				desk,
				waitingOrders: waiting.map((p) => ({
					id: p.id,
					supplierName: p.supplier.name,
					totalAmount: Number(p.totalAmount) || 0,
					createdAt: p.createdAt.toISOString(),
				})),
			},
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Client dashboard error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
