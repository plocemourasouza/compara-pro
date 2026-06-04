import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const resolvedParams = await params;
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
		}

		const upload = await prisma.uploadHistory.findUnique({
			where: {
				id: resolvedParams.id,
				companyId: user.company?.id,
			},
		});

		if (!upload) {
			return NextResponse.json(
				{ error: "Upload não encontrado" },
				{ status: 404 },
			);
		}

		if (upload.status !== "FAILED") {
			return NextResponse.json(
				{ error: "Apenas uploads com falha podem ser reprocessados" },
				{ status: 400 },
			);
		}

		// Atualizar status para processando
		await prisma.uploadHistory.update({
			where: { id: resolvedParams.id },
			data: {
				status: "PROCESSING",
				processedAt: null,
			},
		});

		// Aqui você iniciaria o reprocessamento em background
		// Por exemplo, com uma queue job ou worker
		// Para este POC, vamos simular um reprocessamento bem-sucedido
		setTimeout(async () => {
			try {
				await prisma.uploadHistory.update({
					where: { id: resolvedParams.id },
					data: {
						status: "COMPLETED",
						processedAt: new Date(),
						errorRows: 0,
					},
				});
			} catch (error) {
				console.error("Erro no reprocessamento simulado:", error);
			}
		}, 3000); // Simula 3 segundos de processamento

		return NextResponse.json({
			message: "Reprocessamento iniciado com sucesso",
			uploadId: resolvedParams.id,
		});
	} catch (error) {
		console.error("Reprocess upload error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
