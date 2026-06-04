"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function markAllNotificationsReadAction() {
	try {
		const user = await requireAuth();

		await prisma.notification.updateMany({
			where: {
				userId: user.id,
				read: false,
			},
			data: {
				read: true,
			},
		});

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Error marking notifications as read:", error);
		return { error: "Erro ao marcar notificações como lidas" };
	}
}

export async function markNotificationReadAction(notificationId: string) {
	try {
		const user = await requireAuth();

		await prisma.notification.update({
			where: {
				id: notificationId,
				userId: user.id,
			},
			data: {
				read: true,
			},
		});

		revalidatePath("/dashboard");
		return { success: true };
	} catch (error) {
		console.error("Error marking notification as read:", error);
		return { error: "Erro ao marcar notificação como lida" };
	}
}
