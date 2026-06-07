import { NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

/** Vínculos do cliente com os fornecedores representados (carteira). */
async function carteiraLinks(supplierIds: string[], clientId: string) {
	if (supplierIds.length === 0) return [];
	return prisma.supplierClient.findMany({
		where: {
			supplierCompanyId: { in: supplierIds },
			clientCompanyId: clientId,
		},
		include: { supplier: { select: { id: true, name: true } } },
	});
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const supplierIds = await getRepresentedSupplierIds(user);

		const links = await carteiraLinks(supplierIds, id);
		if (links.length === 0 && user.role !== "ADMIN") {
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

		// Fornecedores representados que carregam este cliente — alimenta o
		// seletor de fornecedor das indicações.
		const suppliers = links.map((l) => ({
			id: l.supplier.id,
			name: l.supplier.name,
		}));

		return NextResponse.json({ client, demands, suppliers });
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
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE"]);
		const supplierIds = await getRepresentedSupplierIds(user);

		const links = await carteiraLinks(supplierIds, id);
		if (links.length === 0) {
			return NextResponse.json(
				{ error: "Cliente não está na sua carteira" },
				{ status: 404 },
			);
		}

		// Remove de um fornecedor específico (?supplierCompanyId=) ou de todos os
		// fornecedores representados — nunca apaga a empresa do cliente.
		const only = new URL(request.url).searchParams.get("supplierCompanyId");
		const toRemove = only
			? links.filter((l) => l.supplierCompanyId === only)
			: links;
		if (toRemove.length === 0) {
			return NextResponse.json(
				{ error: "Vínculo não encontrado" },
				{ status: 404 },
			);
		}
		await prisma.supplierClient.deleteMany({
			where: { id: { in: toRemove.map((l) => l.id) } },
		});
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
