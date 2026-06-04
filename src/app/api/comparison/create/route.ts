import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { ProductMatcher } from "@/lib/services/product-matcher";

const createComparisonSchema = z.object({
	uploadId: z.string().min(1, "Upload ID é obrigatório"),
});

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
		const validationResult = createComparisonSchema.safeParse(body);
		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Dados inválidos",
					details: validationResult.error.issues,
				},
				{ status: 400 },
			);
		}

		const { uploadId } = validationResult.data;

		// Criar comparação
		const comparisonId = await ProductMatcher.createComparison(
			uploadId,
			user.company.id,
		);

		return NextResponse.json({
			success: true,
			message: "Comparação criada com sucesso",
			comparisonId,
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Create comparison error:", error);

		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
