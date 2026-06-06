"use server";

import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma";
import { generateToken, hashPassword, verifyPassword } from "@/lib/auth";
import {
	activationExpiry,
	buildActivationLink,
	generateActivationCode,
	hashActivationCode,
	verifyActivationCode,
} from "@/lib/auth-activation";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email/mailer";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

function dashboardFor(role: string): string {
	return role === "ADMIN"
		? "/admin"
		: role === "SUPPLIER"
			? "/supplier"
			: "/client";
}

async function setAuthCookie(userId: string): Promise<void> {
	const token = generateToken({ userId });
	const cookieStore = await cookies();
	cookieStore.set("auth_token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		maxAge: 60 * 60 * 24 * 7, // 7 dias
	});
}

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

		// Conta pendente de ativação (criada sem senha)
		if (!user.password) {
			return {
				error:
					"Conta ainda não ativada. Faça o primeiro acesso para definir sua senha.",
				pendingActivation: true,
			};
		}

		// Verificar password
		const isValid = await verifyPassword(password, user.password);
		if (!isValid) {
			return {
				error: "Credenciais inválidas",
			};
		}

		await setAuthCookie(user.id);

		return {
			success: true,
			redirectUrl: dashboardFor(user.role),
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

export async function activateAccountAction(
	_prevState: unknown,
	formData: FormData,
) {
	try {
		const email = (formData.get("email") as string)?.trim();
		const code = (formData.get("code") as string)?.trim();
		const password = formData.get("password") as string;
		const confirmPassword = formData.get("confirmPassword") as string;

		if (!email || !code) {
			return { error: "Informe o e-mail e o código." };
		}
		if (!password || password.length < 6) {
			return { error: "A senha deve ter pelo menos 6 caracteres." };
		}
		if (password !== confirmPassword) {
			return { error: "As senhas não conferem." };
		}

		const user = await prisma.user.findUnique({ where: { email } });

		// Erro genérico — não revela qual parte falhou.
		const genericError = { error: "Código inválido ou expirado." };
		if (
			!user ||
			user.password ||
			!user.activationCodeHash ||
			!user.activationExpiresAt
		) {
			return genericError;
		}
		if (user.activationExpiresAt.getTime() < Date.now()) {
			return genericError;
		}
		const ok = await verifyActivationCode(code, user.activationCodeHash);
		if (!ok) {
			return genericError;
		}

		const hashed = await hashPassword(password);
		await prisma.user.update({
			where: { id: user.id },
			data: {
				password: hashed,
				activationCodeHash: null,
				activationExpiresAt: null,
			},
		});

		await setAuthCookie(user.id);

		return { success: true, redirectUrl: dashboardFor(user.role) };
	} catch (error) {
		console.error("Activate account error:", error);
		return { error: "Erro interno do servidor" };
	}
}

export async function resendActivationCodeAction(
	_prevState: unknown,
	formData: FormData,
) {
	try {
		const email = (formData.get("email") as string)?.trim();
		if (!email) {
			return { error: "Informe o e-mail." };
		}

		const user = await prisma.user.findUnique({
			where: { email },
			select: { id: true, email: true, password: true },
		});

		// Só reenvia para conta pendente; resposta genérica evita enumeração de e-mail.
		if (user && !user.password) {
			const code = generateActivationCode();
			const activationCodeHash = await hashActivationCode(code);
			await prisma.user.update({
				where: { id: user.id },
				data: { activationCodeHash, activationExpiresAt: activationExpiry() },
			});
			const link = buildActivationLink();
			await sendNotificationEmail({
				to: [user.email],
				subject: "Seu código de primeiro acesso — Compara Pró",
				message: `Seu novo código de primeiro acesso é ${code}. Acesse ${link} para confirmar o código e definir sua senha. O código expira em 7 dias.`,
			});
		}

		return {
			success: true,
			message:
				"Se a conta existir e estiver pendente, enviamos um novo código por e-mail.",
		};
	} catch (error) {
		console.error("Resend activation code error:", error);
		return { error: "Erro interno do servidor" };
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
