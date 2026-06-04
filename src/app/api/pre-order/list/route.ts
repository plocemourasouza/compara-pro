import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { PreOrderService } from "@/lib/services/pre-order-service";

export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth(["CLIENT", "SUPPLIER"]);

		if (!user.company) {
			return NextResponse.json(
				{ error: "Usuário deve estar associado a uma empresa" },
				{ status: 400 },
			);
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);

		const result = await PreOrderService.listPreOrders(
			user.company.id,
			user.role as "CLIENT" | "SUPPLIER",
			page,
			Math.min(limit, 50), // Max 50 per page
		);

		return NextResponse.json(result);
	} catch (error) {
		console.error("List pre-orders error:", error);

		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
