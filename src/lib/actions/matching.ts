"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function createManualMatchAction(
	comparisonId: string,
	supplierProductId: string,
	clientProductId: string,
) {
	try {
		const user = await requireAuth();

		// Verificar se a comparação pertence ao usuário/empresa
		const comparison = await prisma.comparison.findFirst({
			where: {
				id: comparisonId,
				clientId: user.company?.id,
			},
		});

		if (!comparison) {
			return { error: "Comparação não encontrada ou não autorizada" };
		}

		// Produto do fornecedor vem do catálogo `products` (FK de SupplierMatch
		// aponta para Product.id), não do staging `uploadedProduct`.
		const supplierProduct = await prisma.product.findUnique({
			where: { id: supplierProductId },
			include: { company: true },
		});

		if (supplierProduct?.company.type !== "SUPPLIER") {
			return { error: "Produto do fornecedor não encontrado" };
		}

		// Verificar se já existe um match para este produto
		const existingMatch = await prisma.comparisonMatch.findFirst({
			where: {
				comparisonId,
				clientProductId,
			},
		});

		if (existingMatch) {
			// Atualizar match existente
			await prisma.comparisonMatch.update({
				where: { id: existingMatch.id },
				data: {
					matchType: "MANUAL",
					confidence: 1.0,
				},
			});

			// Criar/atualizar supplier match
			// Buscar supplier match existente
			const existingSupplierMatch = await prisma.supplierMatch.findFirst({
				where: {
					comparisonMatchId: existingMatch.id,
					supplierCompanyId: supplierProduct.companyId,
				},
			});

			if (existingSupplierMatch) {
				// Atualizar supplier match existente
				await prisma.supplierMatch.update({
					where: { id: existingSupplierMatch.id },
					data: {
						supplierProductId,
						price: supplierProduct.price ?? 0,
						availableQuantity: supplierProduct.quantity || 0,
						isActive: true,
					},
				});
			} else {
				// Criar novo supplier match
				await prisma.supplierMatch.create({
					data: {
						comparisonMatchId: existingMatch.id,
						supplierProductId,
						supplierCompanyId: supplierProduct.companyId,
						price: supplierProduct.price ?? 0,
						availableQuantity: supplierProduct.quantity || 0,
						isActive: true,
					},
				});
			}
		} else {
			// Criar novo match
			const _newMatch = await prisma.comparisonMatch.create({
				data: {
					comparisonId,
					clientProductId,
					productName: supplierProduct.name,
					matchType: "MANUAL",
					confidence: 1.0,
					bestPrice: supplierProduct.price,
					supplierMatches: {
						create: [
							{
								supplierCompanyId: supplierProduct.companyId,
								supplierProductId,
								price: supplierProduct.price ?? 0,
								availableQuantity: supplierProduct.quantity || 0,
								isActive: true,
							},
						],
					},
				},
			});
		}

		// Criar notificação
		await prisma.notification.create({
			data: {
				userId: user.id,
				type: "MATCH_CREATED",
				title: "Match manual criado",
				message: `Match manual criado para o produto "${supplierProduct.name}"`,
				metadata: {
					comparisonId,
					productId: supplierProductId,
				},
			},
		});

		revalidatePath("/dashboard/compare");
		return { success: true, message: "Match manual criado com sucesso" };
	} catch (error) {
		console.error("Error creating manual match:", error);
		return { error: "Erro ao criar match manual" };
	}
}
