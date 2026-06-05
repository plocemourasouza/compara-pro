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

// Schema do formulário (price é string no input; convertido para número no submit).
export const productFormSchema = z.object({
	code: z.string().optional().or(z.literal("")),
	sku: z.string().optional().or(z.literal("")),
	name: z.string().min(1, "Nome é obrigatório").max(200, "Nome muito longo"),
	price: z.string().optional().or(z.literal("")),
	description: z.string().optional().or(z.literal("")),
	category: z.string().optional().or(z.literal("")),
	unit: z.string().optional().or(z.literal("")),
	companyId: z.string().min(1, "Empresa é obrigatória"),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
