import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
});

export const registerSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
	role: z.enum(["ADMIN", "SUPPLIER", "CLIENT"]),
	companyName: z
		.string()
		.min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
