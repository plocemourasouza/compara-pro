import { NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { preOrderScopeWhere } from "@/lib/services/pre-order-scope";

type Bucket = { count: number; value: number };

// Indicadores da lista de pré-pedidos: total + por status (pendente/aprovado/
// rejeitado), cada um com contagem e valor somado, no escopo do usuário.
export async function GET() {
	try {
		const user = await requireAuth(["CLIENT", "REPRESENTATIVE", "ADMIN"]);
		if (user.area !== "ADMIN" && !user.company) {
			return NextResponse.json({ error: "Sem empresa" }, { status: 403 });
		}

		const supplierIds =
			user.area === "REPRESENTATIVE"
				? await getRepresentedSupplierIds(user)
				: undefined;
		const where = preOrderScopeWhere(
			{ clientId: user.company?.id ?? null, supplierIds },
			user.area as "CLIENT" | "REPRESENTATIVE" | "ADMIN",
		);

		const groups = await prisma.preOrder.groupBy({
			by: ["status"],
			where,
			_count: { _all: true },
			_sum: { totalAmount: true },
		});

		const empty = (): Bucket => ({ count: 0, value: 0 });
		const stats = {
			total: empty(),
			pending: empty(), // ACTIVE
			approved: empty(), // FINALIZED
			rejected: empty(), // REJECTED
		};
		for (const g of groups) {
			const bucket: Bucket = {
				count: g._count._all,
				value: Number(g._sum.totalAmount) || 0,
			};
			stats.total.count += bucket.count;
			stats.total.value += bucket.value;
			if (g.status === "ACTIVE") stats.pending = bucket;
			else if (g.status === "FINALIZED") stats.approved = bucket;
			else if (g.status === "REJECTED") stats.rejected = bucket;
		}

		return NextResponse.json(stats);
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Pre-order stats error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
