import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
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
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Mark all notifications as read error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
