import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function PUT(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const resolvedParams = await params;
	try {
		const user = await requireAuth();

		// Update notification as read
		const notification = await prisma.notification.updateMany({
			where: {
				id: resolvedParams.id,
				userId: user.id,
			},
			data: {
				read: true,
			},
		});

		if (notification.count === 0) {
			return NextResponse.json(
				{ error: "Notificação não encontrada" },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Mark notification as read error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
