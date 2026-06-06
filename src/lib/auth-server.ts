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
				phone: true,
				role: true,
				preferences: true,
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

/** Thrown by requireAuth — carries the HTTP status so routes return 401/403, not 500. */
export class AuthError extends Error {
	readonly status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = "AuthError";
		this.status = status;
	}
}

export async function requireAuth(allowedRoles?: string[]) {
	const user = await getCurrentUser();

	if (!user) {
		throw new AuthError("Usuário não autenticado", 401);
	}

	if (allowedRoles && !allowedRoles.includes(user.role)) {
		throw new AuthError("Acesso negado", 403);
	}

	return user;
}
