import { type NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { PreOrderService } from "@/lib/services/pre-order-service";
import { createPreOrderBatchSchema } from "@/lib/validations/pre-order";

export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth(["CLIENT"]);
		if (!user.company) {
			return NextResponse.json(
				{ error: "Empresa não encontrada" },
				{ status: 400 },
			);
		}

		const body = await request.json();
		const parsed = createPreOrderBatchSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Dados inválidos", details: parsed.error.issues },
				{ status: 400 },
			);
		}

		const preOrderIds = await PreOrderService.createPreOrdersBatch(
			parsed.data,
			user.company.id,
		);
		return NextResponse.json({ success: true, preOrderIds });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Create pre-orders batch error:", error);
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
