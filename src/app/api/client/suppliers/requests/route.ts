import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const schema = z.object({ supplierCompanyId: z.string().min(1) });

export async function POST(request: Request) {
	try {
		const user = await requireAuth(["CLIENT"]);
		const companyId = user.company?.id;
		if (!companyId) {
			return NextResponse.json(
				{ error: "Cliente sem empresa associada" },
				{ status: 400 },
			);
		}

		const parsed = schema.safeParse(await request.json());
		if (!parsed.success) {
			return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
		}
		const supplierCompanyId = parsed.data.supplierCompanyId;

		const supplier = await prisma.company.findUnique({
			where: { id: supplierCompanyId },
			select: { id: true, type: true },
		});
		if (supplier?.type !== "SUPPLIER") {
			return NextResponse.json(
				{ error: "Fornecedor não encontrado" },
				{ status: 404 },
			);
		}

		const alreadyLinked = await prisma.supplierClient.findUnique({
			where: {
				supplierCompanyId_clientCompanyId: {
					supplierCompanyId,
					clientCompanyId: companyId,
				},
			},
		});
		if (alreadyLinked) {
			return NextResponse.json(
				{ error: "Você já está vinculado a este fornecedor." },
				{ status: 409 },
			);
		}

		const existingPending = await prisma.supplierLinkRequest.findFirst({
			where: {
				supplierCompanyId,
				clientCompanyId: companyId,
				status: "PENDING",
			},
		});
		if (existingPending) {
			return NextResponse.json(
				{ error: "Já existe uma solicitação pendente para este fornecedor." },
				{ status: 409 },
			);
		}

		const req = await prisma.supplierLinkRequest.create({
			data: { supplierCompanyId, clientCompanyId: companyId },
		});

		// Notifica os usuários do fornecedor.
		const supplierUsers = await prisma.user.findMany({
			where: { companyId: supplierCompanyId, deletedAt: null },
			select: { id: true },
		});
		if (supplierUsers.length) {
			await prisma.notification.createMany({
				data: supplierUsers.map((u) => ({
					userId: u.id,
					type: "SYSTEM_UPDATE" as const,
					title: "Nova solicitação de cliente",
					message: `${user.company?.name ?? "Um cliente"} quer entrar na sua carteira.`,
					metadata: JSON.stringify({
						requestId: req.id,
						clientCompanyId: companyId,
					}),
				})),
			});
		}

		return NextResponse.json(
			{ success: true, requestId: req.id },
			{ status: 201 },
		);
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Create supplier request error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
