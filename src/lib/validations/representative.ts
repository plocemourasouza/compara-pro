import { z } from "zod";

/** Cadastro/edição de um fornecedor (Company type SUPPLIER) que o representante representa. */
export const supplierCompanySchema = z.object({
	name: z.string().min(2, "Informe o nome do fornecedor"),
	cnpj: z
		.string()
		.transform((v) => v.replace(/\D/g, ""))
		.refine((v) => v === "" || v.length === 14, "CNPJ inválido")
		.optional(),
	city: z.string().optional(),
	state: z.string().optional(),
});

export type SupplierCompanyValues = z.infer<typeof supplierCompanySchema>;
