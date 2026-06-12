import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { areaOf } from "@/lib/area";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
	canMutateTarget,
	lockUpdateFields,
	type MutationTarget,
} from "@/lib/services/user-access";

type RouteParams = { params: Promise<{ id: string }> };

// Áreas que podem gerenciar usuários: ADMIN (global) + REPRESENTATIVE/CLIENT
// (autoatendimento — escopo aplicado por canMutateTarget/lockUpdateFields).
const MANAGER_AREAS = ["ADMIN", "REPRESENTATIVE", "CLIENT"];

const updateUserSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
	email: z.string().email("Email inválido").optional(),
	phone: z.string().optional(),
	companyId: z.string().nullable().optional(),
});

const userSelect = {
	id: true,
	name: true,
	email: true,
	phone: true,
	createdAt: true,
	updatedAt: true,
	deletedAt: true,
	companyId: true,
	company: { select: { id: true, name: true, type: true } },
} as const;

// Alvo p/ a checagem de autorização: área derivada de company.type.
function toTarget(u: {
	id: string;
	companyId: string | null;
	company: { type: string } | null;
}): MutationTarget {
	return { id: u.id, area: areaOf(u), companyId: u.companyId };
}

// Carrega o alvo com o mínimo p/ autorização + checagem de e-mail no update.
function loadTarget(id: string) {
	return prisma.user.findUnique({
		where: { id },
		select: {
			id: true,
			email: true,
			companyId: true,
			company: { select: { type: true } },
		},
	});
}

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

const notFound = () =>
	NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

// GET /api/users/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		const actor = await requireAuth(MANAGER_AREAS);
		const targetUser = await prisma.user.findUnique({
			where: { id },
			select: { ...userSelect, password: true, companyId: true },
		});
		if (!targetUser) return notFound();
		// Fora de escopo → 404 (não vaza existência para não-admin).
		if (!canMutateTarget(actor, toTarget(targetUser), "update"))
			return notFound();

		const { password, companyId: _companyId, ...rest } = targetUser;
		return NextResponse.json({ user: { ...rest, pending: !password } });
	} catch (error) {
		return handleError(error, "Get user error:");
	}
}

// PUT /api/users/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		const actor = await requireAuth(MANAGER_AREAS);

		const body = await request.json();
		const parsed = updateUserSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Dados inválidos", details: parsed.error.issues },
				{ status: 400 },
			);
		}

		const existing = await loadTarget(id);
		if (!existing) return notFound();
		if (!canMutateTarget(actor, toTarget(existing), "update"))
			return notFound();

		// Não-admin não altera papel nem empresa do alvo.
		const data = lockUpdateFields(actor, parsed.data);

		if (data.email && data.email !== existing.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email: data.email },
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
			data,
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
		const actor = await requireAuth(MANAGER_AREAS);

		const existing = await loadTarget(id);
		if (!existing) return notFound();
		if (existing.id === actor.id) {
			return NextResponse.json(
				{ error: "Você não pode desativar sua própria conta" },
				{ status: 400 },
			);
		}
		if (!canMutateTarget(actor, toTarget(existing), "deactivate"))
			return notFound();

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
		const actor = await requireAuth(MANAGER_AREAS);

		const body = (await request.json()) as { action?: string };
		if (body.action !== "reactivate") {
			return NextResponse.json(
				{ error: "Ação não reconhecida" },
				{ status: 400 },
			);
		}

		const existing = await loadTarget(id);
		if (!existing) return notFound();
		if (!canMutateTarget(actor, toTarget(existing), "reactivate"))
			return notFound();

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
