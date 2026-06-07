import { NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET() {
	try {
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const companyIds = await getRepresentedSupplierIds(user);

		// Representante sem fornecedores (ou admin sem empresa): métricas vazias.
		if (companyIds.length === 0) {
			return NextResponse.json({
				success: true,
				metrics: {
					products: { active: 0, total: 0 },
					activeCatalog: null,
					preOrders: { pending: 0, approved: 0, rejected: 0, totalValue: 0 },
					uploads: { total: 0, failed: 0 },
					clients: 0,
					suppliers: 0,
					recentPreOrders: [],
				},
			});
		}

		const companyId = { in: companyIds };
		const [
			productsActive,
			productsTotal,
			activeCatalog,
			preOrdersByStatus,
			approvedSum,
			uploadsTotal,
			uploadsFailed,
			clientsCount,
			recent,
		] = await Promise.all([
			prisma.product.count({
				where: { companyId, isActive: true, deletedAt: null },
			}),
			prisma.product.count({ where: { companyId, deletedAt: null } }),
			prisma.uploadHistory.findFirst({
				where: { companyId, uploadType: "SUPPLIER_PRODUCTS", isActive: true },
				select: { fileName: true, uploadedAt: true },
				orderBy: { uploadedAt: "desc" },
			}),
			prisma.preOrder.groupBy({
				by: ["status"],
				where: { supplierId: companyId },
				_count: { status: true },
			}),
			prisma.preOrder.aggregate({
				where: { supplierId: companyId, status: "FINALIZED" },
				_sum: { totalAmount: true },
			}),
			prisma.uploadHistory.count({ where: { companyId } }),
			prisma.uploadHistory.count({ where: { companyId, status: "FAILED" } }),
			prisma.supplierClient.count({ where: { supplierCompanyId: companyId } }),
			prisma.preOrder.findMany({
				where: { supplierId: companyId },
				orderBy: { createdAt: "desc" },
				take: 5,
				select: {
					id: true,
					status: true,
					totalAmount: true,
					createdAt: true,
					client: { select: { name: true } },
					supplier: { select: { name: true } },
				},
			}),
		]);

		const count = (s: string) =>
			preOrdersByStatus.find((p) => p.status === s)?._count.status ?? 0;

		return NextResponse.json({
			success: true,
			metrics: {
				products: { active: productsActive, total: productsTotal },
				activeCatalog,
				preOrders: {
					pending: count("ACTIVE"),
					approved: count("FINALIZED"),
					rejected: count("REJECTED"),
					totalValue: Number(approvedSum._sum?.totalAmount) || 0,
				},
				uploads: { total: uploadsTotal, failed: uploadsFailed },
				clients: clientsCount,
				suppliers: companyIds.length,
				recentPreOrders: recent.map((p) => ({
					id: p.id,
					clientName: p.client.name,
					supplierName: p.supplier.name,
					status: p.status,
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
		console.error("Supplier dashboard error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
