import { z } from "zod";

export const userRoles = ["ADMIN", "SUPPLIER", "CLIENT"] as const;
export type UserRole = (typeof userRoles)[number];

// Schema do formulário de criação (espelha o contrato de POST /api/users).
export const createUserFormSchema = z
	.object({
		name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
		email: z.string().email("Email inválido"),
		password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
		role: z.enum(userRoles),
		companyName: z.string().optional().or(z.literal("")),
	})
	.refine((d) => d.role === "ADMIN" || !!d.companyName?.trim(), {
		message: "Empresa é obrigatória para usuários não-admin",
		path: ["companyName"],
	});

// Schema do formulário de edição (espelha PUT /api/users/[id]).
export const updateUserFormSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	role: z.enum(userRoles),
	password: z
		.union([
			z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
			z.literal(""),
		])
		.optional(),
});

export interface UserFormValues {
	name: string;
	email: string;
	password: string;
	role: UserRole;
	companyName: string;
}
