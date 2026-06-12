import { z } from "zod";
import { validations } from "@/lib/utils/masks";

export const userRoles = ["ADMIN", "REPRESENTATIVE", "CLIENT"] as const;
export type UserRole = (typeof userRoles)[number];

const phoneField = z
	.string()
	.min(1, "Telefone é obrigatório")
	.refine((v) => validations.phone(v), "Telefone inválido");

// Schema do formulário de criação (espelha o contrato de POST /api/users).
// Empresa é exigida apenas quando o campo é exibido (admin criando não-admin);
// essa regra fica no UserForm (depende do ator), não no schema estático.
export const createUserFormSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	phone: phoneField,
	role: z.enum(userRoles),
	companyName: z.string().optional().or(z.literal("")),
});

// Schema do formulário de edição (espelha PUT /api/users/[id]).
export const updateUserFormSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	phone: phoneField,
	role: z.enum(userRoles),
	companyName: z.string().optional().or(z.literal("")),
});

export interface UserFormValues {
	name: string;
	email: string;
	phone: string;
	role: UserRole;
	companyName: string;
}
