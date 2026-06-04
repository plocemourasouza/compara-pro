import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { PreOrderService } from "@/lib/services/pre-order-service";
import { createPreOrderSchema } from "@/lib/validations/pre-order";

export async function POST(request: NextRequest) {
	try {
		const user = await requireAuth(["CLIENT"]);

		if (!user.company) {
			return NextResponse.json(
				{ error: "Usuário deve estar associado a uma empresa" },
				{ status: 400 },
			);
		}

		const body = await request.json();

		// Validar dados de entrada
		const validationResult = createPreOrderSchema.safeParse(body);
		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Dados inválidos",
					details: validationResult.error.issues,
				},
				{ status: 400 },
			);
		}

		// Criar pré-pedido
		const preOrderId = await PreOrderService.createPreOrder(
			validationResult.data,
			user.company.id,
		);

		return NextResponse.json(
			{
				success: true,
				message: "Pré-pedido criado com sucesso",
				preOrderId,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Create pre-order error:", error);

		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
