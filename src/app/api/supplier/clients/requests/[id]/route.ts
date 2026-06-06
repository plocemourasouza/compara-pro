import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const schema = z.object({ action: z.enum(["APPROVE", "REJECT"]) });

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await requireAuth(["SUPPLIER"]);
		const supplierCompanyId = user.company?.id;
		if (!supplierCompanyId) {
			return NextResponse.json({ error: "Sem empresa" }, { status: 400 });
		}

		const parsed = schema.safeParse(await request.json());
		if (!parsed.success) {
			return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
		}

		const req = await prisma.supplierLinkRequest.findUnique({ where: { id } });
		if (!req || req.supplierCompanyId !== supplierCompanyId) {
			return NextResponse.json(
				{ error: "Solicitação não encontrada" },
				{ status: 404 },
			);
		}
		if (req.status !== "PENDING") {
			return NextResponse.json(
				{ error: "Solicitação já respondida" },
				{ status: 409 },
			);
		}

		const approve = parsed.data.action === "APPROVE";

		await prisma.$transaction(async (tx) => {
			await tx.supplierLinkRequest.update({
				where: { id },
				data: {
					status: approve ? "APPROVED" : "REJECTED",
					respondedAt: new Date(),
				},
			});
			if (approve) {
				// Vínculo idempotente.
				const existing = await tx.supplierClient.findUnique({
					where: {
						supplierCompanyId_clientCompanyId: {
							supplierCompanyId,
							clientCompanyId: req.clientCompanyId,
						},
					},
				});
				if (!existing) {
					await tx.supplierClient.create({
						data: {
							supplierCompanyId,
							clientCompanyId: req.clientCompanyId,
						},
					});
				}
			}
		});

		// Notifica os usuários do cliente.
		const clientUsers = await prisma.user.findMany({
			where: { companyId: req.clientCompanyId, deletedAt: null },
			select: { id: true },
		});
		if (clientUsers.length) {
			await prisma.notification.createMany({
				data: clientUsers.map((u) => ({
					userId: u.id,
					type: "SYSTEM_UPDATE" as const,
					title: approve
						? "Fornecedor aprovou seu vínculo"
						: "Fornecedor recusou seu vínculo",
					message: approve
						? `${user.company?.name ?? "O fornecedor"} aceitou você na carteira.`
						: `${user.company?.name ?? "O fornecedor"} recusou a solicitação.`,
					metadata: JSON.stringify({ supplierCompanyId }),
				})),
			});
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Respond supplier request error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
