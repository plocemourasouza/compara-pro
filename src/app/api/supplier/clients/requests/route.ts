import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

// Solicitações de clientes pendentes para o fornecedor logado.
export async function GET() {
	try {
		const user = await requireAuth(["SUPPLIER", "ADMIN"]);
		const supplierCompanyId = user.company?.id;
		if (!supplierCompanyId) {
			return NextResponse.json({ requests: [] });
		}

		const requests = await prisma.supplierLinkRequest.findMany({
			where: { supplierCompanyId, status: "PENDING" },
			orderBy: { createdAt: "desc" },
			select: {
				id: true,
				createdAt: true,
				client: {
					select: { id: true, name: true, cnpj: true, city: true, state: true },
				},
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
