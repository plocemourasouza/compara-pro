import { z } from "zod";

export const createProductSchema = z.object({
	code: z.string().optional(),
	sku: z.string().optional(),
	name: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
	price: z.number().optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	unit: z.string().optional(),
	companyId: z.string().min(1, "Empresa é obrigatória"),
});

export const updateProductSchema = z.object({
	code: z.string().optional(),
	sku: z.string().optional(),
	name: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
	price: z.number().optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	unit: z.string().optional(),
	companyId: z.string().min(1, "Empresa é obrigatória"),
});

export type CreateProductData = z.infer<typeof createProductSchema>;
export type UpdateProductData = z.infer<typeof updateProductSchema>;
