import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return null;
		}

		const payload = verifyToken(token) as { userId: string };

		const user = await prisma.user.findUnique({
			where: { id: payload.userId },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				company: {
					select: {
						id: true,
						name: true,
						type: true,
					},
				},
			},
		});

		return user;
	} catch (error) {
		console.error("Get current user error:", error);
		return null;
	}
}

export async function requireAuth(allowedRoles?: string[]) {
	const user = await getCurrentUser();

	if (!user) {
		throw new Error("Usuário não autenticado");
	}

	if (allowedRoles && !allowedRoles.includes(user.role)) {
		throw new Error("Acesso negado");
	}

	return user;
}
