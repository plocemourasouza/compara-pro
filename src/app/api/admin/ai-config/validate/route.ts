import { type NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/lib/ai/registry";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { aiConfigValidateSchema } from "@/lib/validations/ai-config";

export async function POST(request: NextRequest) {
	try {
		await requireAuth(["ADMIN"]);

		const body = await request.json();
		const parsed = aiConfigValidateSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
		}

		// Returns { valid, models, error? } — 200 even when invalid (inline feedback).
		const result = await getProvider(parsed.data.provider).validateKey(
			parsed.data.key,
		);
		return NextResponse.json(result);
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Validate AI key error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
