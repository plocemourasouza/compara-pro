import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { OptimizedProductMatcher } from "@/lib/services/optimized-product-matcher";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string; uploadId: string }> },
) {
	try {
		const { id, uploadId } = await params;
		const user = await requireAuth(["SUPPLIER", "ADMIN"]);
		const supplierCompanyId = user.company?.id;
		if (!supplierCompanyId) {
			return NextResponse.json({ error: "Sem empresa" }, { status: 400 });
		}

		// Cliente precisa estar na carteira do fornecedor.
		if (user.role !== "ADMIN") {
			const link = await prisma.supplierClient.findUnique({
				where: {
					supplierCompanyId_clientCompanyId: {
						supplierCompanyId,
						clientCompanyId: id,
					},
				},
			});
			if (!link) {
				return NextResponse.json(
					{ error: "Cliente não está na sua carteira" },
					{ status: 404 },
				);
			}
		}

		// A demanda precisa pertencer ao cliente informado.
		const upload = await prisma.uploadHistory.findFirst({
			where: { id: uploadId, companyId: id, uploadType: "CLIENT_REQUIREMENTS" },
			select: { id: true, fileName: true },
		});
		if (!upload) {
			return NextResponse.json(
				{ error: "Demanda não encontrada" },
				{ status: 404 },
			);
		}

		const indications = await OptimizedProductMatcher.getSupplierIndications(
			uploadId,
			supplierCompanyId,
		);

		return NextResponse.json({ fileName: upload.fileName, ...indications });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Supplier indications error:", error);
		return NextResponse.json(
			{ error: "Erro ao gerar indicações" },
			{ status: 500 },
		);
	}
}
