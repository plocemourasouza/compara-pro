import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

/** Garante que o cliente está na carteira do fornecedor logado. */
async function assertInCarteira(supplierCompanyId: string, clientId: string) {
	const link = await prisma.supplierClient.findUnique({
		where: {
			supplierCompanyId_clientCompanyId: {
				supplierCompanyId,
				clientCompanyId: clientId,
			},
		},
	});
	return link;
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await requireAuth(["SUPPLIER", "ADMIN"]);
		const supplierCompanyId = user.company?.id;
		if (!supplierCompanyId) {
			return NextResponse.json({ error: "Sem empresa" }, { status: 400 });
		}

		const link = await assertInCarteira(supplierCompanyId, id);
		if (!link && user.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Cliente não está na sua carteira" },
				{ status: 404 },
			);
		}

		const [client, demands] = await Promise.all([
			prisma.company.findUnique({
				where: { id },
				select: {
					id: true,
					name: true,
					cnpj: true,
					email: true,
					phone: true,
					city: true,
					state: true,
				},
			}),
			prisma.uploadHistory.findMany({
				where: { companyId: id, uploadType: "CLIENT_REQUIREMENTS" },
				orderBy: { uploadedAt: "desc" },
				select: {
					id: true,
					fileName: true,
					status: true,
					totalRows: true,
					processedRows: true,
					errorRows: true,
					uploadedAt: true,
				},
			}),
		]);

		if (!client) {
			return NextResponse.json(
				{ error: "Cliente não encontrado" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ client, demands });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Get supplier client error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await requireAuth(["SUPPLIER"]);
		const supplierCompanyId = user.company?.id;
		if (!supplierCompanyId) {
			return NextResponse.json({ error: "Sem empresa" }, { status: 400 });
		}

		const link = await assertInCarteira(supplierCompanyId, id);
		if (!link) {
			return NextResponse.json(
				{ error: "Cliente não está na sua carteira" },
				{ status: 404 },
			);
		}

		// Remove só o vínculo — não apaga a empresa do cliente.
		await prisma.supplierClient.delete({ where: { id: link.id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Remove supplier client error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
