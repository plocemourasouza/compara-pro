import { type NextRequest, NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
		}

		const upload = await prisma.uploadHistory.findUnique({
			where: { id },
			select: {
				id: true,
				fileName: true,
				uploadType: true,
				uploadedAt: true,
				totalRows: true,
				companyId: true,
				company: { select: { name: true } },
				uploadedBy: { select: { name: true } },
			},
		});

		if (!upload) {
			return NextResponse.json(
				{ error: "Lista não encontrada" },
				{ status: 404 },
			);
		}

		// Scoping por área: ADMIN tudo; REPRESENTATIVE só fornecedores da carteira;
		// CLIENT só uploads da própria empresa.
		if (user.area === "REPRESENTATIVE") {
			const ids = await getRepresentedSupplierIds(user);
			if (!ids.includes(upload.companyId)) {
				return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
			}
		} else if (user.area === "CLIENT") {
			if (upload.companyId !== user.company?.id) {
				return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
			}
		}

		// Produtos de fornecedor vêm do catálogo (Product por lastUploadId);
		// requisitos de cliente vêm do staging (UploadedProduct, com targetPrice/qtd).
		const items =
			upload.uploadType === "SUPPLIER_PRODUCTS"
				? await prisma.product.findMany({
						where: { lastUploadId: upload.id, deletedAt: null },
						select: {
							id: true,
							sku: true,
							code: true,
							name: true,
							price: true,
							category: true,
							unit: true,
						},
						orderBy: { name: "asc" },
					})
				: await prisma.uploadedProduct.findMany({
						where: { uploadId: upload.id },
						select: {
							id: true,
							sku: true,
							code: true,
							name: true,
							price: true,
							targetPrice: true,
							category: true,
							unit: true,
							quantity: true,
						},
						orderBy: { name: "asc" },
					});

		const { companyId: _companyId, ...uploadInfo } = upload;
		return NextResponse.json({ upload: uploadInfo, items });
	} catch (error) {
		console.error("Get upload items error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
