import { type NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const resolvedParams = await params;
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
		}

		// Admin vê qualquer upload; demais só os da própria empresa.
		const where: Prisma.UploadHistoryWhereInput = { id: resolvedParams.id };
		if (user.area !== "ADMIN") {
			where.companyId = user.company?.id;
		}

		const upload = await prisma.uploadHistory.findFirst({
			where,
			include: {
				products: {
					take: 50, // Limite para não sobrecarregar
					select: {
						id: true,
						sku: true,
						code: true,
						name: true,
						price: true,
						category: true,
						unit: true,
					},
				},
			},
		});

		if (!upload) {
			return NextResponse.json(
				{ error: "Upload não encontrado" },
				{ status: 404 },
			);
		}

		// Upload de fornecedor: produtos vêm do CATÁLOGO (`products` por lastUploadId),
		// não mais do staging UploadedProduct (F6 — staging supplier descontinuado).
		// Client mantém o staging (guarda targetPrice/quantity).
		const { products: stagingProducts, ...uploadRest } = upload;
		const products =
			upload.uploadType === "SUPPLIER_PRODUCTS"
				? await prisma.product.findMany({
						where: { lastUploadId: upload.id, deletedAt: null },
						take: 50,
						select: {
							id: true,
							sku: true,
							code: true,
							name: true,
							price: true,
							category: true,
							unit: true,
						},
					})
				: stagingProducts;

		// Simular erros (em uma implementação real, isso viria de uma tabela de erros)
		const errors =
			upload.errorRows > 0
				? Array.from(
						{ length: Math.min(upload.errorRows, 10) },
						(_, index) => ({
							row: index + 1,
							error: `Erro na linha ${index + 1}: Campo obrigatório ausente`,
						}),
					)
				: [];

		return NextResponse.json({
			upload: {
				...uploadRest,
				products,
				errors,
			},
		});
	} catch (error) {
		console.error("Get upload detail error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
