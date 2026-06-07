import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email/mailer";

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

		if (user.role !== "REPRESENTATIVE") {
			return NextResponse.json(
				{ error: "Apenas representantes podem responder pré-pedidos" },
				{ status: 403 },
			);
		}

		const representedIds = await getRepresentedSupplierIds(user);

		const body = await request.json();
		const validationResult = bulkActionSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{ error: "Dados inválidos", details: validationResult.error.issues },
				{ status: 400 },
			);
		}

		const { preOrderIds, action, notes } = validationResult.data;

		// Pré-pedidos devem pertencer a um fornecedor representado e estar ativos.
		const preOrders = await prisma.preOrder.findMany({
			where: {
				id: { in: preOrderIds },
				supplierId: { in: representedIds },
				status: "ACTIVE",
			},
			include: { supplier: { select: { name: true } } },
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
				select: { id: true, email: true },
			});

			const supplierNames = [
				...new Set(clientPreOrders.map((p) => p.supplier.name)),
			];
			const plural = clientPreOrders.length > 1;
			const title = `Pré-pedido${plural ? "s" : ""} ${action === "APPROVE" ? "aprovado" : "rejeitado"}${plural ? "s" : ""}`;
			const message = `${clientPreOrders.length} pré-pedido${plural ? "s foram" : " foi"} ${action === "APPROVE" ? "aprovado" : "rejeitado"} por ${supplierNames.join(", ")}`;

			for (const clientUser of clientUsers) {
				await prisma.notification.create({
					data: {
						userId: clientUser.id,
						type:
							action === "APPROVE"
								? "PRE_ORDER_APPROVED"
								: "PRE_ORDER_REJECTED",
						title,
						message,
						metadata: {
							preOrderIds: clientPreOrders.map((p) => p.id),
							action,
							supplierIds: [
								...new Set(clientPreOrders.map((p) => p.supplierId)),
							],
							supplierNames,
						},
					},
				});
			}

			// Best-effort email (no-op when email is disabled)
			await sendNotificationEmail({
				to: clientUsers.map((u) => u.email),
				subject: title,
				message,
			});
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
