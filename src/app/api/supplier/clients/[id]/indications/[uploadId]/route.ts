import { NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { OptimizedProductMatcher } from "@/lib/services/optimized-product-matcher";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string; uploadId: string }> },
) {
	try {
		const { id, uploadId } = await params;
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const supplierIds = await getRepresentedSupplierIds(user);
		const requested = new URL(request.url).searchParams.get(
			"supplierCompanyId",
		);

		// As indicações são por fornecedor (preço varia). Resolve qual fornecedor:
		// o solicitado (se representado) ou o primeiro representado que carrega o
		// cliente. Admin precisa informar o fornecedor explicitamente.
		let supplierCompanyId: string | null = null;
		if (user.area === "ADMIN") {
			supplierCompanyId = requested;
		} else if (requested && supplierIds.includes(requested)) {
			supplierCompanyId = requested;
		} else {
			const link = await prisma.supplierClient.findFirst({
				where: { supplierCompanyId: { in: supplierIds }, clientCompanyId: id },
				select: { supplierCompanyId: true },
			});
			supplierCompanyId = link?.supplierCompanyId ?? null;
		}
		if (!supplierCompanyId) {
			return NextResponse.json(
				{ error: "Cliente não está na sua carteira" },
				{ status: 404 },
			);
		}

		// Cliente precisa estar na carteira do fornecedor escolhido.
		if (user.area !== "ADMIN") {
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

		return NextResponse.json({
			fileName: upload.fileName,
			supplierCompanyId,
			...indications,
		});
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
