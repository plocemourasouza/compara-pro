import { NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

// Solicitações de clientes pendentes para os fornecedores representados.
export async function GET() {
	try {
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const supplierIds = await getRepresentedSupplierIds(user);
		if (supplierIds.length === 0) {
			return NextResponse.json({ requests: [] });
		}

		const requests = await prisma.supplierLinkRequest.findMany({
			where: { supplierCompanyId: { in: supplierIds }, status: "PENDING" },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				createdAt: true,
				client: {
					select: { id: true, name: true, cnpj: true, city: true, state: true },
				},
				supplier: { select: { id: true, name: true } },
			},
		});

		return NextResponse.json({
			requests: requests.map((r) => ({
				id: r.id,
				requestedAt: r.createdAt,
				clientId: r.client.id,
				name: r.client.name,
				cnpj: r.client.cnpj,
				city: r.client.city,
				state: r.client.state,
				supplierId: r.supplier.id,
				supplierName: r.supplier.name,
			})),
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("List supplier requests error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
