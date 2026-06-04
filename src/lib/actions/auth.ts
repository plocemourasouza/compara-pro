"use server";

import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma";
import { generateToken, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export async function loginAction(_prevState: unknown, formData: FormData) {
	try {
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		// Validar dados de entrada
		const validationResult = loginSchema.safeParse({ email, password });
		if (!validationResult.success) {
			return {
				error: "Dados inválidos",
				details: validationResult.error.issues,
			};
		}

		// Buscar usuário
		const user = await prisma.user.findUnique({
			where: { email },
			include: { company: true },
		});

		if (!user) {
			return {
				error: "Credenciais inválidas",
			};
		}

		// Verificar password
		const isValid = await verifyPassword(password, user.password);
		if (!isValid) {
			return {
				error: "Credenciais inválidas",
			};
		}

		// Gerar token e salvar em cookie
		const token = generateToken({ userId: user.id });
		const cookieStore = await cookies();
		cookieStore.set("auth_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7, // 7 dias
		});

		// Retornar sucesso e URL de redirecionamento
		const dashboardUrl =
			user.role === "ADMIN"
				? "/admin"
				: user.role === "SUPPLIER"
					? "/supplier"
					: "/client";
		return {
			success: true,
			redirectUrl: dashboardUrl,
		};
	} catch (error) {
		console.error("Login error:", error);
		return {
			error: "Erro interno do servidor",
		};
	}
}

export async function registerAction(_prevState: unknown, formData: FormData) {
	try {
		const name = formData.get("name") as string;
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;
		const role = formData.get("role") as string;
		const companyName = formData.get("companyName") as string;

		// Validar dados de entrada
		const validationResult = registerSchema.safeParse({
			name,
			email,
			password,
			role,
			companyName,
		});

		if (!validationResult.success) {
			return {
				error: "Dados inválidos",
				details: validationResult.error.issues,
			};
		}

		// Verificar se usuário já existe
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return {
				error: "Email já está em uso",
			};
		}

		// Buscar ou criar empresa
		let company = await prisma.company.findFirst({
			where: { name: companyName },
		});

		if (!company) {
			company = await prisma.company.create({
				data: {
					name: companyName,
					type: role === "SUPPLIER" ? "SUPPLIER" : "CLIENT",
				},
			});
		}

		// Verificar limite de usuários por empresa
		const userCount = await prisma.user.count({
			where: { companyId: company.id },
		});

		if (userCount >= 10) {
			return {
				error: "Limite de usuários da empresa atingido",
			};
		}

		// Criar usuário
		const hashedPassword = await hashPassword(password);
		const user = await prisma.user.create({
			data: {
				name,
				email,
				password: hashedPassword,
				role: role as Role,
				companyId: company.id,
			},
			include: { company: true },
		});

		// Gerar token e salvar em cookie
		const token = generateToken({ userId: user.id });
		const cookieStore = await cookies();
		cookieStore.set("auth_token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 60 * 60 * 24 * 7, // 7 dias
		});

		// Retornar sucesso e URL de redirecionamento
		const dashboardUrl =
			user.role === "ADMIN"
				? "/admin"
				: user.role === "SUPPLIER"
					? "/supplier"
					: "/client";
		return {
			success: true,
			redirectUrl: dashboardUrl,
		};
	} catch (error) {
		console.error("Register error:", error);
		return {
			error: "Erro interno do servidor",
		};
	}
}

export async function logoutAction() {
	try {
		const cookieStore = await cookies();
		cookieStore.delete("auth_token");
		return {
			success: true,
			redirectUrl: "/auth/login",
		};
	} catch (error) {
		console.error("Logout error:", error);
		return {
			error: "Erro ao fazer logout",
		};
	}
}
