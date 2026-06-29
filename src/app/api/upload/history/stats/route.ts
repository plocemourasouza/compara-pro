import { NextResponse } from "next/server";
import { scopedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

// Indicadores da tela "Listas de Preço": listas ativas, produtos ativos e o
// valor total do catálogo ativo, no escopo do usuário (ADMIN tudo, rep carteira).
export async function GET() {
	try {
		const user = await requireAuth(["ADMIN", "REPRESENTATIVE"]);
		const supplierIds = await scopedSupplierIds(user);
		if (supplierIds.length === 0) {
			return NextResponse.json({
				activeLists: 0,
				products: 0,
				totalValue: 0,
			});
		}

		const companyId = { in: supplierIds };
		const [activeLists, products, value] = await Promise.all([
			prisma.uploadHistory.count({
				where: {
					companyId,
					uploadType: "SUPPLIER_PRODUCTS",
					isActive: true,
				},
			}),
			prisma.product.count({
				where: { companyId, isActive: true, deletedAt: null },
			}),
			prisma.product.aggregate({
				_sum: { price: true },
				where: { companyId, isActive: true, deletedAt: null },
			}),
		]);

		return NextResponse.json({
			activeLists,
			products,
			totalValue: Number(value._sum.price) || 0,
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Upload history stats error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
