import { type NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth();

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "20", 10);
		const unreadOnly = searchParams.get("unreadOnly") === "true";

		const where: { userId: string; read?: boolean } = { userId: user.id };
		if (unreadOnly) {
			where.read = false;
		}

		const [notifications, total, unreadCount] = await Promise.all([
			prisma.notification.findMany({
				where,
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: Math.min(limit, 50),
			}),
			prisma.notification.count({ where }),
			prisma.notification.count({
				where: { userId: user.id, read: false },
			}),
		]);

		return NextResponse.json({
			notifications: notifications.map((notification) => ({
				id: notification.id,
				type: notification.type,
				title: notification.title,
				message: notification.message,
				data: notification.metadata
					? JSON.parse(notification.metadata as string)
					: null,
				read: notification.read,
				createdAt: notification.createdAt,
			})),
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
			unreadCount,
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Get notifications error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
