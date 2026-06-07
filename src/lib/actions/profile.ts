"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
	type ActionResult,
	preferencesSchema,
} from "@/lib/validations/preferences";

const profileSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	phone: z.string().optional(),
});

const passwordSchema = z.object({
	currentPassword: z.string().min(1, "Informe a senha atual"),
	newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
});

export async function updateProfileAction(
	input: unknown,
): Promise<ActionResult> {
	const user = await getCurrentUser();
	if (!user) return { success: false, error: "Não autenticado" };

	const parsed = profileSchema.safeParse(input);
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Dados inválidos",
		};
	}

	const { name, email, phone } = parsed.data;
	if (email !== user.email) {
		const exists = await prisma.user.findUnique({ where: { email } });
		if (exists) return { success: false, error: "Email já está em uso" };
	}

	await prisma.user.update({
		where: { id: user.id },
		data: { name, email, phone: phone?.trim() ? phone.trim() : null },
	});
	revalidatePath("/perfil");
	revalidatePath("/admin/settings");
	revalidatePath("/supplier/settings");
	revalidatePath("/client/settings");
	return { success: true };
}

export async function changePasswordAction(
	input: unknown,
): Promise<ActionResult> {
	const user = await getCurrentUser();
	if (!user) return { success: false, error: "Não autenticado" };

	const parsed = passwordSchema.safeParse(input);
	if (!parsed.success) {
		return {
			success: false,
			error: parsed.error.issues[0]?.message ?? "Dados inválidos",
		};
	}

	const dbUser = await prisma.user.findUnique({
		where: { id: user.id },
		select: { password: true },
	});
	if (!dbUser) return { success: false, error: "Usuário não encontrado" };
	if (!dbUser.password) {
		return { success: false, error: "Conta sem senha definida" };
	}

	const ok = await verifyPassword(parsed.data.currentPassword, dbUser.password);
	if (!ok) return { success: false, error: "Senha atual incorreta" };

	await prisma.user.update({
		where: { id: user.id },
		data: { password: await hashPassword(parsed.data.newPassword) },
	});
	return { success: true };
}

export async function savePreferencesAction(
	input: unknown,
): Promise<ActionResult> {
	const user = await getCurrentUser();
	if (!user) return { success: false, error: "Não autenticado" };

	const parsed = preferencesSchema.safeParse(input);
	if (!parsed.success) {
		return { success: false, error: "Preferências inválidas" };
	}

	await prisma.user.update({
		where: { id: user.id },
		data: { preferences: parsed.data as Prisma.InputJsonValue },
	});
	revalidatePath("/admin/settings");
	return { success: true };
}
