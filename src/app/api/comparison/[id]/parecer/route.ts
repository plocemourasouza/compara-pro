import { type NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { ParecerService } from "@/lib/services/parecer-service";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	try {
		const user = await requireAuth(["CLIENT"]);
		if (!user.company) {
			return NextResponse.json(
				{ error: "Usuário deve estar associado a uma empresa" },
				{ status: 400 },
			);
		}

		// Ownership: a buyer can only see the parecer of their own comparison.
		const owned = await prisma.comparison.findFirst({
			where: { id, clientId: user.company.id },
			select: { id: true },
		});
		if (!owned) {
			return NextResponse.json(
				{ error: "Comparação não encontrada" },
				{ status: 404 },
			);
		}

		const parecer = await ParecerService.getOrGenerate(id);
		return NextResponse.json({ parecer });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Get parecer error:", error);
		return NextResponse.json(
			{ error: "Erro ao gerar parecer" },
			{ status: 500 },
		);
	}
}
