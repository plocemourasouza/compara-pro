import { z } from "zod";

/** Cadastro/edição de um fornecedor (Company type SUPPLIER) que o representante representa. */
export const supplierCompanySchema = z.object({
	name: z.string().min(2, "Informe o nome do fornecedor"),
	legalName: z.string().optional(),
	cnpj: z
		.string()
		.transform((v) => v.replace(/\D/g, ""))
		.refine((v) => v === "" || v.length === 14, "CNPJ inválido")
		.optional(),
	zipCode: z.string().optional(),
	street: z.string().optional(),
	number: z.string().optional(),
	neighborhood: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	email: z.string().email("E-mail inválido").optional().or(z.literal("")),
	phone: z.string().optional(),
	responsibleName: z.string().optional(),
	responsibleEmail: z
		.string()
		.email("E-mail inválido")
		.optional()
		.or(z.literal("")),
	responsiblePhone: z.string().optional(),
	// Agência dona do vínculo: obrigatória só quando o ADMIN cadastra.
	representativeCompanyId: z.string().optional(),
});

export type SupplierCompanyValues = z.infer<typeof supplierCompanySchema>;
