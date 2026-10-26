import { type NextRequest, NextResponse } from "next/server";
import { getRepresentedSupplierIds, ownsUploadCompany } from "@/lib/auth-scope";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { storedUploadErrors } from "@/lib/upload-row-error";

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

		const upload = await prisma.uploadHistory.findFirst({
			where: { id: resolvedParams.id },
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

		const representedIds =
			user.area === "REPRESENTATIVE"
				? await getRepresentedSupplierIds(user)
				: [];
		if (!ownsUploadCompany(user, upload.companyId, representedIds)) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		// Upload de fornecedor: produtos vêm do CATÁLOGO (`products` por lastUploadId),
		// não mais do staging UploadedProduct (F6 — staging supplier descontinuado).
		// Client mantém o staging (guarda targetPrice/quantity).
		const { products: stagingProducts, errorDetails, ...uploadRest } = upload;
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

		const errors = storedUploadErrors(errorDetails).map((item) => ({
			row: item.row,
			field: item.field,
			error: item.message,
			value: item.value,
		}));

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
