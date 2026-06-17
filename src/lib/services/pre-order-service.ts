import type { NotificationType } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email/mailer";
import { preOrderScopeWhere } from "@/lib/services/pre-order-scope";
import type {
	CreatePreOrderBatchData,
	CreatePreOrderData,
} from "@/lib/validations/pre-order";

// biome-ignore lint/complexity/noStaticOnlyClass: intentional static utility namespace
export class PreOrderService {
	static async createPreOrder(
		data: CreatePreOrderData,
		clientId: string,
	): Promise<string> {
		try {
			// Validate comparison ownership
			const comparison = await prisma.comparison.findUnique({
				where: { id: data.comparisonId },
				include: {
					matches: {
						where: { id: { in: data.selectedMatches } },
						include: {
							supplierMatches: {
								where: { supplierCompanyId: data.supplierId },
							},
							clientProduct: { select: { targetPrice: true } },
						},
					},
				},
			});

			if (!comparison || comparison.clientId !== clientId) {
				throw new Error("Comparação não encontrada ou não autorizada");
			}

			// Validate selected matches belong to the specified supplier
			const validMatches = comparison.matches.filter((match) =>
				match.supplierMatches.some(
					(sm) => sm.supplierCompanyId === data.supplierId,
				),
			);

			if (validMatches.length === 0) {
				throw new Error(
					"Nenhum produto válido encontrado para este fornecedor",
				);
			}

			// Calculate total amount
			let totalAmount = 0;
			const items: Array<{
				matchId: string;
				quantity: number;
				price: number;
				totalPrice: number;
				baselinePrice: number | null;
			}> = [];

			for (const match of validMatches) {
				const supplierMatch = match.supplierMatches.find(
					(sm) => sm.supplierCompanyId === data.supplierId,
				);
				if (!supplierMatch) continue;

				const quantity = data.quantities?.[match.id] || 1;
				const price = supplierMatch.price;
				const totalPrice = price * quantity;

				items.push({
					matchId: match.id,
					quantity,
					price,
					totalPrice,
					baselinePrice: match.clientProduct?.targetPrice ?? null,
				});

				totalAmount += totalPrice;
			}

			// Representante (regra de negócio): herdado da carteira do par
			// (fornecedor, cliente). Sem carteira não há representante → não cria.
			const carteira = await prisma.supplierClient.findUnique({
				where: {
					supplierCompanyId_clientCompanyId: {
						supplierCompanyId: data.supplierId,
						clientCompanyId: clientId,
					},
				},
				select: { representativeCompanyId: true },
			});
			if (!carteira) {
				throw new Error(
					"Fornecedor sem vínculo de carteira com o cliente — pré-pedido exige representante",
				);
			}

			// Create pre-order
			const preOrder = await prisma.preOrder.create({
				data: {
					comparisonId: data.comparisonId,
					clientId,
					supplierId: data.supplierId,
					representativeId: carteira.representativeCompanyId,
					status: "ACTIVE",
					totalAmount,
					notes: data.notes,
					items: {
						create: items.map((item) => ({
							matchId: item.matchId,
							productId: "", // Will be updated with actual product ID
							quantity: item.quantity,
							price: item.price,
							totalPrice: item.totalPrice,
							baselinePrice: item.baselinePrice,
						})),
					},
				},
				include: {
					items: true,
					client: true,
					supplier: true,
				},
			});

			// Update items with actual product IDs
			for (const item of preOrder.items) {
				const match = validMatches.find((m) => m.id === item.matchId);
				if (match) {
					const supplierMatch = match.supplierMatches.find(
						(sm) => sm.supplierCompanyId === data.supplierId,
					);
					if (supplierMatch) {
						await prisma.preOrderItem.update({
							where: { id: item.id },
							data: { productId: supplierMatch.supplierProductId },
						});
					}
				}
			}

			// Create notification for supplier
			await PreOrderService.createNotification(
				data.supplierId,
				"PRE_ORDER_CREATED",
				"Novo pré-pedido recebido",
				`Você recebeu um novo pré-pedido de ${preOrder.client.name}`,
				{ preOrderId: preOrder.id },
			);

			return preOrder.id;
		} catch (error) {
			console.error("Create pre-order error:", error);
			throw error instanceof Error
				? error
				: new Error("Erro ao criar pré-pedido");
		}
	}

	/**
	 * Create one pre-order per supplier group, atomically (single transaction).
	 * Returns the created pre-order ids. Supplier notifications are best-effort
	 * (fired after commit, never block the order).
	 */
	static async createPreOrdersBatch(
		data: CreatePreOrderBatchData,
		clientId: string,
	): Promise<string[]> {
		const comparison = await prisma.comparison.findUnique({
			where: { id: data.comparisonId },
			select: { clientId: true },
		});
		if (!comparison || comparison.clientId !== clientId) {
			throw new Error("Comparação não encontrada ou não autorizada");
		}

		const created = await prisma.$transaction(async (tx) => {
			const results: Array<{
				id: string;
				supplierId: string;
				clientName: string;
			}> = [];

			for (const group of data.groups) {
				const matches = await tx.comparisonMatch.findMany({
					where: {
						id: { in: group.selectedMatches },
						comparisonId: data.comparisonId,
					},
					include: {
						supplierMatches: {
							where: { supplierCompanyId: group.supplierId },
						},
						clientProduct: { select: { targetPrice: true } },
					},
				});

				let totalAmount = 0;
				const items: Array<{
					matchId: string;
					productId: string;
					quantity: number;
					price: number;
					totalPrice: number;
					baselinePrice: number | null;
				}> = [];

				for (const match of matches) {
					const supplierMatch = match.supplierMatches.find(
						(sm) => sm.supplierCompanyId === group.supplierId,
					);
					if (!supplierMatch) continue;

					const quantity = group.quantities?.[match.id] ?? 1;
					const price = supplierMatch.price;
					items.push({
						matchId: match.id,
						productId: supplierMatch.supplierProductId,
						quantity,
						price,
						totalPrice: price * quantity,
						baselinePrice: match.clientProduct?.targetPrice ?? null,
					});
					totalAmount += price * quantity;
				}

				if (items.length === 0) continue;

				// Representante herdado da carteira (fornecedor, cliente).
				const carteira = await tx.supplierClient.findUnique({
					where: {
						supplierCompanyId_clientCompanyId: {
							supplierCompanyId: group.supplierId,
							clientCompanyId: clientId,
						},
					},
					select: { representativeCompanyId: true },
				});
				if (!carteira) {
					throw new Error(
						"Fornecedor sem vínculo de carteira com o cliente — pré-pedido exige representante",
					);
				}

				const preOrder = await tx.preOrder.create({
					data: {
						comparisonId: data.comparisonId,
						clientId,
						supplierId: group.supplierId,
						representativeId: carteira.representativeCompanyId,
						status: "ACTIVE",
						totalAmount,
						notes: data.notes,
						items: { create: items },
					},
					include: { client: { select: { name: true } } },
				});

				results.push({
					id: preOrder.id,
					supplierId: group.supplierId,
					clientName: preOrder.client.name,
				});
			}

			if (results.length === 0) {
				throw new Error("Nenhum produto válido para criar pré-pedido");
			}
			return results;
		});

		for (const r of created) {
			await PreOrderService.createNotification(
				r.supplierId,
				"PRE_ORDER_CREATED",
				"Novo pré-pedido recebido",
				`Você recebeu um novo pré-pedido de ${r.clientName}`,
				{ preOrderId: r.id },
			);
		}

		return created.map((r) => r.id);
	}

	static async respondToPreOrder(
		preOrderId: string,
		supplierId: string,
		action: "APPROVE" | "REJECT",
		notes?: string,
	): Promise<void> {
		try {
			// Find pre-order
			const preOrder = await prisma.preOrder.findUnique({
				where: { id: preOrderId },
				include: { client: true, supplier: true },
			});

			if (!preOrder || preOrder.supplierId !== supplierId) {
				throw new Error("Pré-pedido não encontrado ou não autorizado");
			}

			if (preOrder.status !== "ACTIVE") {
				throw new Error("Pré-pedido já foi respondido");
			}

			// Update pre-order status
			const newStatus = action === "APPROVE" ? "FINALIZED" : "REJECTED";

			await prisma.preOrder.update({
				where: { id: preOrderId },
				data: {
					status: newStatus,
					notes: notes
						? `${preOrder.notes || ""}\n\nResposta: ${notes}`.trim()
						: preOrder.notes,
					respondedAt: new Date(),
				},
			});

			// Create notification for client
			const notificationType =
				action === "APPROVE" ? "PRE_ORDER_APPROVED" : "PRE_ORDER_REJECTED";
			const title =
				action === "APPROVE" ? "Pré-pedido aprovado!" : "Pré-pedido rejeitado";
			const message =
				action === "APPROVE"
					? `Seu pré-pedido foi aprovado por ${preOrder.supplier.name}`
					: `Seu pré-pedido foi rejeitado por ${preOrder.supplier.name}`;

			await PreOrderService.createNotification(
				preOrder.clientId,
				notificationType,
				title,
				message,
				{ preOrderId },
			);
		} catch (error) {
			console.error("Respond to pre-order error:", error);
			throw error instanceof Error
				? error
				: new Error("Erro ao responder pré-pedido");
		}
	}

	static async getPreOrder(preOrderId: string, companyId: string) {
		try {
			const preOrder = await prisma.preOrder.findUnique({
				where: { id: preOrderId },
				include: {
					client: true,
					supplier: true,
					comparison: {
						include: {
							clientUpload: {
								select: { fileName: true, uploadedAt: true },
							},
						},
					},
					items: {
						include: {
							match: {
								include: {
									clientProduct: true,
									supplierMatches: {
										where: { supplierCompanyId: companyId },
										include: {
											supplierProduct: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!preOrder) {
				throw new Error("Pré-pedido não encontrado");
			}

			// Check authorization
			if (
				preOrder.clientId !== companyId &&
				preOrder.supplierId !== companyId
			) {
				throw new Error("Acesso negado");
			}

			return preOrder;
		} catch (error) {
			console.error("Get pre-order error:", error);
			throw error instanceof Error
				? error
				: new Error("Erro ao buscar pré-pedido");
		}
	}

	static async listPreOrders(
		scope: { clientId?: string | null; supplierIds?: string[] },
		role: "CLIENT" | "REPRESENTATIVE" | "ADMIN",
		page: number = 1,
		limit: number = 10,
	) {
		try {
			const where = preOrderScopeWhere(scope, role);

			const [preOrders, total] = await Promise.all([
				prisma.preOrder.findMany({
					where,
					orderBy: { createdAt: "desc" },
					skip: (page - 1) * limit,
					take: limit,
					include: {
						client: { select: { id: true, name: true } },
						supplier: { select: { id: true, name: true } },
						representative: { select: { id: true, name: true } },
						items: { select: { id: true, quantity: true, totalPrice: true } },
					},
				}),
				prisma.preOrder.count({ where }),
			]);

			return {
				preOrders: preOrders.map((po) => ({
					id: po.id,
					status: po.status,
					totalAmount: po.totalAmount,
					itemCount: po.items.length,
					totalQuantity: po.items.reduce((sum, item) => sum + item.quantity, 0),
					createdAt: po.createdAt,
					respondedAt: po.respondedAt,
					client: po.client,
					supplier: po.supplier,
					// Representante único vinculado ao pré-pedido (regra de negócio).
					representative: po.representative,
				})),
				pagination: {
					page,
					limit,
					total,
					pages: Math.ceil(total / limit),
				},
			};
		} catch (error) {
			console.error("List pre-orders error:", error);
			throw new Error("Erro ao buscar pré-pedidos");
		}
	}

	private static async createNotification(
		companyId: string,
		type: NotificationType,
		title: string,
		message: string,
		data?: Record<string, unknown>,
	) {
		try {
			// Get users from company
			const users = await prisma.user.findMany({
				where: { companyId },
				select: { id: true, email: true },
			});

			// Create notifications for all users in company
			await prisma.notification.createMany({
				data: users.map((user) => ({
					userId: user.id,
					type,
					title,
					message,
					metadata: data ? JSON.stringify(data) : undefined,
				})),
			});

			// Best-effort email for pre-order events (no-op when email is disabled)
			if (
				type === "PRE_ORDER_CREATED" ||
				type === "PRE_ORDER_APPROVED" ||
				type === "PRE_ORDER_REJECTED"
			) {
				await sendNotificationEmail({
					to: users.map((u) => u.email),
					subject: title,
					message,
				});
			}
		} catch (error) {
			console.error("Create notification error:", error);
			// Don't throw error to avoid breaking main flow
		}
	}
}
