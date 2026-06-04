import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const bulkActionSchema = z.object({
	preOrderIds: z.array(z.string()).min(1),
	action: z.enum(["APPROVE", "REJECT"]),
	notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
		}

		if (user.role !== "SUPPLIER") {
			return NextResponse.json(
				{ error: "Apenas fornecedores podem responder pré-pedidos" },
				{ status: 403 },
			);
		}

		const body = await request.json();
		const validationResult = bulkActionSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{ error: "Dados inválidos", details: validationResult.error.issues },
				{ status: 400 },
			);
		}

		const { preOrderIds, action, notes } = validationResult.data;

		// Verificar se todos os pré-pedidos pertencem ao fornecedor e estão ativos
		const preOrders = await prisma.preOrder.findMany({
			where: {
				id: { in: preOrderIds },
				supplierId: user.company?.id,
				status: "ACTIVE",
			},
		});

		if (preOrders.length !== preOrderIds.length) {
			return NextResponse.json(
				{
					error:
						"Alguns pré-pedidos não foram encontrados ou não podem ser modificados",
				},
				{ status: 400 },
			);
		}

		// Validar notas para rejeição
		if (action === "REJECT" && !notes?.trim()) {
			return NextResponse.json(
				{ error: "Observações são obrigatórias para rejeição" },
				{ status: 400 },
			);
		}

		// Atualizar todos os pré-pedidos
		const newStatus = action === "APPROVE" ? "FINALIZED" : "REJECTED";

		await prisma.preOrder.updateMany({
			where: {
				id: { in: preOrderIds },
			},
			data: {
				status: newStatus,
				notes: notes?.trim() || null,
				respondedAt: new Date(),
			},
		});

		// Criar notificações para os clientes
		const clientIds = [...new Set(preOrders.map((p) => p.clientId))];

		for (const clientId of clientIds) {
			const clientPreOrders = preOrders.filter((p) => p.clientId === clientId);

			// Buscar usuários da empresa cliente
			const clientUsers = await prisma.user.findMany({
				where: { companyId: clientId },
			});

			for (const clientUser of clientUsers) {
				await prisma.notification.create({
					data: {
						userId: clientUser.id,
						type:
							action === "APPROVE"
								? "PRE_ORDER_APPROVED"
								: "PRE_ORDER_REJECTED",
						title: `Pré-pedido${clientPreOrders.length > 1 ? "s" : ""} ${action === "APPROVE" ? "aprovado" : "rejeitado"}${clientPreOrders.length > 1 ? "s" : ""}`,
						message: `${clientPreOrders.length} pré-pedido${clientPreOrders.length > 1 ? "s foram" : " foi"} ${action === "APPROVE" ? "aprovado" : "rejeitado"} por ${user.company?.name}`,
						metadata: {
							preOrderIds: clientPreOrders.map((p) => p.id),
							action,
							supplierId: user.company?.id,
							supplierName: user.company?.name,
						},
					},
				});
			}
		}

		return NextResponse.json({
			message: `${preOrders.length} pré-pedido${preOrders.length > 1 ? "s" : ""} ${action === "APPROVE" ? "aprovado" : "rejeitado"}${preOrders.length > 1 ? "s" : ""} com sucesso`,
			updatedCount: preOrders.length,
		});
	} catch (error) {
		console.error("Bulk action error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
