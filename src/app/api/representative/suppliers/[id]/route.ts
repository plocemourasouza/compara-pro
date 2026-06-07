import { NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { supplierCompanySchema } from "@/lib/validations/representative";

type RouteParams = { params: Promise<{ id: string }> };

// Edita os dados da empresa fornecedora (apenas se representada).
export async function PUT(request: Request, { params }: RouteParams) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE"]);
		const ids = await getRepresentedSupplierIds(user);
		if (!ids.includes(id)) {
			return NextResponse.json(
				{ error: "Fornecedor não encontrado" },
				{ status: 404 },
			);
		}

		const parsed = supplierCompanySchema.safeParse(await request.json());
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
				{ status: 400 },
			);
		}
		const data = parsed.data;
		const cnpj = data.cnpj && data.cnpj.length === 14 ? data.cnpj : null;

		const supplier = await prisma.company.update({
			where: { id },
			data: {
				name: data.name,
				cnpj,
				city: data.city || null,
				state: data.state || null,
			},
			select: { id: true, name: true },
		});
		return NextResponse.json({ supplier });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Update represented supplier error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// Desvincula o fornecedor do representante (não apaga a empresa nem produtos).
export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE"]);

		const link = await prisma.representativeSupplier.findUnique({
			where: {
				representativeId_supplierCompanyId: {
					representativeId: user.id,
					supplierCompanyId: id,
				},
			},
		});
		if (!link) {
			return NextResponse.json(
				{ error: "Vínculo não encontrado" },
				{ status: 404 },
			);
		}

		await prisma.representativeSupplier.delete({ where: { id: link.id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Unlink represented supplier error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
