import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

const updateUserSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
	email: z.string().email("Email inválido").optional(),
	password: z
		.string()
		.min(6, "Senha deve ter pelo menos 6 caracteres")
		.optional(),
	role: z.enum(["ADMIN", "SUPPLIER", "CLIENT"]).optional(),
	companyId: z.string().nullable().optional(),
});

const userSelect = {
	id: true,
	name: true,
	email: true,
	role: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	company: { select: { id: true, name: true, type: true } },
} as const;

function handleError(error: unknown, label: string) {
	if (error instanceof AuthError) {
		return NextResponse.json(
			{ error: error.message },
			{ status: error.status },
		);
	}
	console.error(label, error);
	return NextResponse.json(
		{ error: "Erro interno do servidor" },
		{ status: 500 },
	);
}

// GET /api/users/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		await requireAuth(["ADMIN"]);
		const targetUser = await prisma.user.findUnique({
			where: { id },
			select: userSelect,
		});
		if (!targetUser) {
			return NextResponse.json(
				{ error: "Usuário não encontrado" },
				{ status: 404 },
			);
		}
		return NextResponse.json({ user: targetUser });
	} catch (error) {
		return handleError(error, "Get user error:");
	}
}

// PUT /api/users/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		await requireAuth(["ADMIN"]);

		const body = await request.json();
		const parsed = updateUserSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Dados inválidos", details: parsed.error.issues },
				{ status: 400 },
			);
		}

		const existing = await prisma.user.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json(
				{ error: "Usuário não encontrado" },
				{ status: 404 },
			);
		}

		const { password, ...rest } = parsed.data;
		if (rest.email && rest.email !== existing.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email: rest.email },
			});
			if (emailExists) {
				return NextResponse.json(
					{ error: "Email já está em uso" },
					{ status: 409 },
				);
			}
		}

		const updated = await prisma.user.update({
			where: { id },
			data: {
				...rest,
				...(password ? { password: await hashPassword(password) } : {}),
			},
			select: userSelect,
		});
		return NextResponse.json({
			message: "Usuário atualizado com sucesso",
			user: updated,
		});
	} catch (error) {
		return handleError(error, "Update user error:");
	}
}

// DELETE /api/users/[id] — soft delete
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		const user = await requireAuth(["ADMIN"]);

		const existing = await prisma.user.findUnique({ where: { id } });
		if (!existing) {
			return NextResponse.json(
				{ error: "Usuário não encontrado" },
				{ status: 404 },
			);
		}
		if (existing.id === user.id) {
			return NextResponse.json(
				{ error: "Você não pode desativar sua própria conta" },
				{ status: 400 },
			);
		}

		const deleted = await prisma.user.update({
			where: { id },
			data: { deletedAt: new Date() },
			select: { id: true, name: true, email: true, deletedAt: true },
		});
		return NextResponse.json({
			message: "Usuário desativado com sucesso",
			user: deleted,
		});
	} catch (error) {
		return handleError(error, "Delete user error:");
	}
}

// PATCH /api/users/[id] — reactivate
export async function PATCH(request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		await requireAuth(["ADMIN"]);

		const body = (await request.json()) as { action?: string };
		if (body.action !== "reactivate") {
			return NextResponse.json(
				{ error: "Ação não reconhecida" },
				{ status: 400 },
			);
		}

		const reactivated = await prisma.user.update({
			where: { id },
			data: { deletedAt: null },
			select: { id: true, name: true, email: true, deletedAt: true },
		});
		return NextResponse.json({
			message: "Usuário reativado com sucesso",
			user: reactivated,
		});
	} catch (error) {
		return handleError(error, "Reactivate user error:");
	}
}
