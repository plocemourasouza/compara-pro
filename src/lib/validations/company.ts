import { z } from "zod";

// Função auxiliar para validar CNPJ
const validateCNPJ = (cnpj: string): boolean => {
	// Remove caracteres não numéricos
	const cleanCNPJ = cnpj.replace(/[^\d]/g, "");

	// Verifica se tem 14 dígitos
	if (cleanCNPJ.length !== 14) return false;

	// Verifica se não são todos iguais
	if (/^(\d)\1+$/.test(cleanCNPJ)) return false;

	// Validação dos dígitos verificadores
	let soma = 0;
	let peso = 5;

	// Primeiro dígito
	for (let i = 0; i < 12; i++) {
		soma += Number.parseInt(cleanCNPJ[i] ?? "0", 10) * peso;
		peso = peso === 2 ? 9 : peso - 1;
	}

	const digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
	if (Number.parseInt(cleanCNPJ[12] ?? "0", 10) !== digito1) return false;

	// Segundo dígito
	soma = 0;
	peso = 6;

	for (let i = 0; i < 13; i++) {
		soma += Number.parseInt(cleanCNPJ[i] ?? "0", 10) * peso;
		peso = peso === 2 ? 9 : peso - 1;
	}

	const digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
	return Number.parseInt(cleanCNPJ[13] ?? "0", 10) === digito2;
};

// Função auxiliar para validar CEP
const validateCEP = (cep: string): boolean => {
	const cleanCEP = cep.replace(/[^\d]/g, "");
	return cleanCEP.length === 8;
};

// Estados brasileiros
const brazilianStates = [
	"AC",
	"AL",
	"AP",
	"AM",
	"BA",
	"CE",
	"DF",
	"ES",
	"GO",
	"MA",
	"MT",
	"MS",
	"MG",
	"PA",
	"PB",
	"PR",
	"PE",
	"PI",
	"RJ",
	"RN",
	"RS",
	"RO",
	"RR",
	"SC",
	"SP",
	"SE",
	"TO",
] as const;

export const createCompanySchema = z.object({
	// Dados básicos da empresa
	name: z
		.string()
		.min(1, "Nome fantasia é obrigatório")
		.max(100, "Nome muito longo"),
	legalName: z
		.string()
		.min(1, "Razão social é obrigatória")
		.max(200, "Razão social muito longa"),
	cnpj: z
		.string()
		.min(1, "CNPJ é obrigatório")
		.refine(validateCNPJ, "CNPJ inválido"),
	type: z.enum(["SUPPLIER", "CLIENT", "REPRESENTATIVE"]),
	status: z.enum(["ACTIVE", "BLOCKED", "INACTIVE"]).optional(),
	taxRegime: z.enum([
		"MEI",
		"SIMPLES_NACIONAL",
		"LUCRO_PRESUMIDO",
		"LUCRO_REAL",
	]),
	email: z.string().email("Email inválido").optional().or(z.literal("")),
	phone: z
		.string()
		.min(10, "Telefone deve ter pelo menos 10 dígitos")
		.max(15, "Telefone muito longo")
		.optional()
		.or(z.literal("")),

	// Dados do responsável
	responsibleName: z
		.string()
		.min(1, "Nome do responsável é obrigatório")
		.max(100, "Nome muito longo"),
	responsibleEmail: z.string().email("Email do responsável inválido"),
	responsiblePhone: z
		.string()
		.min(10, "Telefone deve ter pelo menos 10 dígitos")
		.max(15, "Telefone muito longo"),

	// Dados de localização
	addressType: z
		.string()
		.min(1, "Tipo de logradouro é obrigatório")
		.max(20, "Tipo muito longo"),
	street: z
		.string()
		.min(1, "Logradouro é obrigatório")
		.max(200, "Logradouro muito longo"),
	number: z
		.string()
		.min(1, "Número é obrigatório")
		.max(10, "Número muito longo"),
	neighborhood: z
		.string()
		.min(1, "Bairro é obrigatório")
		.max(100, "Bairro muito longo"),
	city: z
		.string()
		.min(1, "Cidade é obrigatória")
		.max(100, "Cidade muito longa"),
	state: z.enum(brazilianStates, { message: "Estado inválido" }),
	zipCode: z
		.string()
		.min(1, "CEP é obrigatório")
		.refine(validateCEP, "CEP inválido"),
	addressReference: z
		.string()
		.max(200, "Referência muito longa")
		.optional()
		.or(z.literal("")),
});

export const updateCompanySchema = z.object({
	// Dados básicos da empresa
	name: z
		.string()
		.min(1, "Nome fantasia é obrigatório")
		.max(100, "Nome muito longo"),
	legalName: z
		.string()
		.min(1, "Razão social é obrigatória")
		.max(200, "Razão social muito longa"),
	cnpj: z
		.string()
		.min(1, "CNPJ é obrigatório")
		.refine(validateCNPJ, "CNPJ inválido"),
	type: z.enum(["SUPPLIER", "CLIENT", "REPRESENTATIVE"]),
	status: z.enum(["ACTIVE", "BLOCKED", "INACTIVE"]).optional(),
	taxRegime: z.enum([
		"MEI",
		"SIMPLES_NACIONAL",
		"LUCRO_PRESUMIDO",
		"LUCRO_REAL",
	]),
	email: z.string().email("Email inválido").optional().or(z.literal("")),
	phone: z
		.string()
		.min(10, "Telefone deve ter pelo menos 10 dígitos")
		.max(15, "Telefone muito longo")
		.optional()
		.or(z.literal("")),

	// Dados do responsável
	responsibleName: z
		.string()
		.min(1, "Nome do responsável é obrigatório")
		.max(100, "Nome muito longo"),
	responsibleEmail: z.string().email("Email do responsável inválido"),
	responsiblePhone: z
		.string()
		.min(10, "Telefone deve ter pelo menos 10 dígitos")
		.max(15, "Telefone muito longo"),

	// Dados de localização
	addressType: z
		.string()
		.min(1, "Tipo de logradouro é obrigatório")
		.max(20, "Tipo muito longo"),
	street: z
		.string()
		.min(1, "Logradouro é obrigatório")
		.max(200, "Logradouro muito longo"),
	number: z
		.string()
		.min(1, "Número é obrigatório")
		.max(10, "Número muito longo"),
	neighborhood: z
		.string()
		.min(1, "Bairro é obrigatório")
		.max(100, "Bairro muito longo"),
	city: z
		.string()
		.min(1, "Cidade é obrigatória")
		.max(100, "Cidade muito longa"),
	state: z.enum(brazilianStates, { message: "Estado inválido" }),
	zipCode: z
		.string()
		.min(1, "CEP é obrigatório")
		.refine(validateCEP, "CEP inválido"),
	addressReference: z
		.string()
		.max(200, "Referência muito longa")
		.optional()
		.or(z.literal("")),
});

// Schema simplificado para listagem
export const companyListSchema = z.object({
	id: z.string(),
	name: z.string(),
	legalName: z.string().nullable(),
	cnpj: z.string().nullable(),
	type: z.enum(["SUPPLIER", "CLIENT", "REPRESENTATIVE"]),
	email: z.string().nullable(),
	phone: z.string().nullable(),
	city: z.string().nullable(),
	state: z.string().nullable(),
	createdAt: z.date(),
});

export type CreateCompanyData = z.infer<typeof createCompanySchema>;
export type UpdateCompanyData = z.infer<typeof updateCompanySchema>;
export type CompanyListData = z.infer<typeof companyListSchema>;
