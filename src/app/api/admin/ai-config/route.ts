import { type NextRequest, NextResponse } from "next/server";
import { getAiConfigPublic, saveAiConfig } from "@/lib/ai/config-service";
import { getProvider } from "@/lib/ai/registry";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { isEncryptionConfigured } from "@/lib/crypto/secret-box";
import { aiConfigSaveSchema } from "@/lib/validations/ai-config";

export async function GET() {
	try {
		await requireAuth(["ADMIN"]);
		const config = await getAiConfigPublic();
		return NextResponse.json(config);
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Get AI config error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		await requireAuth(["ADMIN"]);

		if (!isEncryptionConfigured()) {
			return NextResponse.json(
				{ error: "Criptografia não configurada (AI_CONFIG_ENCRYPTION_KEY)" },
				{ status: 500 },
			);
		}

		const body = await request.json();
		const parsed = aiConfigSaveSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Dados inválidos", details: parsed.error.issues },
				{ status: 400 },
			);
		}

		const { provider, key, model } = parsed.data;

		// Re-validate the key + model server-side before persisting.
		const result = await getProvider(provider).validateKey(key);
		if (!result.valid) {
			return NextResponse.json(
				{ error: result.error ?? "Chave inválida" },
				{ status: 400 },
			);
		}
		if (!result.models.some((m) => m.id === model)) {
			return NextResponse.json(
				{ error: "Modelo indisponível para esta chave" },
				{ status: 400 },
			);
		}

		await saveAiConfig({ provider, key, model });
		const config = await getAiConfigPublic();
		return NextResponse.json({ success: true, config });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Save AI config error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
