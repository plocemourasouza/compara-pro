import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function PUT() {
	try {
		const user = await requireAuth();

		// Mark all user notifications as read
		await prisma.notification.updateMany({
			where: {
				userId: user.id,
				read: false,
			},
			data: {
				read: true,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Mark all notifications as read error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
