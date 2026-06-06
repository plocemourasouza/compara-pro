import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

// Fornecedores que o cliente ainda pode solicitar (não vinculados nem pendentes).
export async function GET() {
	try {
		const user = await requireAuth(["CLIENT", "ADMIN"]);
		const companyId = user.company?.id;
		if (!companyId) {
			return NextResponse.json({ suppliers: [] });
		}

		const [links, pending] = await Promise.all([
			prisma.supplierClient.findMany({
				where: { clientCompanyId: companyId },
				select: { supplierCompanyId: true },
			}),
			prisma.supplierLinkRequest.findMany({
				where: { clientCompanyId: companyId, status: "PENDING" },
				select: { supplierCompanyId: true },
			}),
		]);
		const exclude = new Set([
			...links.map((l) => l.supplierCompanyId),
			...pending.map((p) => p.supplierCompanyId),
		]);

		const suppliers = await prisma.company.findMany({
			where: { type: "SUPPLIER", deletedAt: null, id: { notIn: [...exclude] } },
			orderBy: { name: "asc" },
			select: { id: true, name: true, cnpj: true, city: true, state: true },
		});

		return NextResponse.json({ suppliers });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Available suppliers error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
