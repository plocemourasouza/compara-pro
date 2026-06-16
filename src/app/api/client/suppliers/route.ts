import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatters } from "@/lib/utils/masks";

export async function GET() {
	try {
		const user = await requireAuth(["CLIENT", "ADMIN"]);
		const companyId = user.company?.id;
		if (!companyId) {
			return NextResponse.json({ linked: [], pending: [] });
		}

		const [links, pending] = await Promise.all([
			prisma.supplierClient.findMany({
				where: { clientCompanyId: companyId },
				orderBy: { createdAt: "desc" },
				select: {
					createdAt: true,
					supplier: {
						select: {
							id: true,
							name: true,
							cnpj: true,
							city: true,
							state: true,
							_count: { select: { products: true } },
						},
					},
				},
			}),
			prisma.supplierLinkRequest.findMany({
				where: { clientCompanyId: companyId, status: "PENDING" },
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					createdAt: true,
					supplier: { select: { id: true, name: true, cnpj: true } },
				},
			}),
		]);

		return NextResponse.json({
			linked: links.map((l) => ({
				id: l.supplier.id,
				name: l.supplier.name,
				cnpj: formatters.redactCnpj(l.supplier.cnpj),
				city: l.supplier.city,
				state: l.supplier.state,
				productCount: l.supplier._count.products,
				since: l.createdAt,
			})),
			pending: pending.map((r) => ({
				requestId: r.id,
				id: r.supplier.id,
				name: r.supplier.name,
				cnpj: formatters.redactCnpj(r.supplier.cnpj),
				requestedAt: r.createdAt,
			})),
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("List client suppliers error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
