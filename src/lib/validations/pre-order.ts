import { z } from "zod";

// Pre-order creation schema
export const createPreOrderSchema = z.object({
	comparisonId: z.string().min(1, "Comparison ID é obrigatório"),
	supplierId: z.string().min(1, "Supplier ID é obrigatório"),
	selectedMatches: z
		.array(z.string())
		.min(1, "Pelo menos um produto deve ser selecionado"),
	notes: z.string().optional(),
	quantities: z
		.record(z.string(), z.number().positive("Quantidade deve ser positiva"))
		.optional(),
});

// Pre-order response schema
export const preOrderResponseSchema = z.object({
	action: z.enum(["APPROVE", "REJECT"]),
	notes: z.string().optional(),
});

// Pre-order item schema
export const preOrderItemSchema = z.object({
	matchId: z.string(),
	quantity: z.number().positive().int(),
	price: z.number().positive(),
	notes: z.string().optional(),
});

// Batch creation — one or more pre-orders (grouped by supplier) in a single action
export const createPreOrderBatchSchema = z.object({
	comparisonId: z.string().min(1, "Comparison ID é obrigatório"),
	groups: z
		.array(
			z.object({
				supplierId: z.string().min(1, "Supplier ID é obrigatório"),
				selectedMatches: z
					.array(z.string())
					.min(1, "Pelo menos um produto deve ser selecionado"),
				quantities: z
					.record(z.string(), z.number().int().positive())
					.optional(),
			}),
		)
		.min(1, "Pelo menos um fornecedor deve ser selecionado"),
	notes: z.string().optional(),
});

export type CreatePreOrderBatchData = z.infer<typeof createPreOrderBatchSchema>;
export type CreatePreOrderData = z.infer<typeof createPreOrderSchema>;
export type PreOrderResponseData = z.infer<typeof preOrderResponseSchema>;
export type PreOrderItemData = z.infer<typeof preOrderItemSchema>;
