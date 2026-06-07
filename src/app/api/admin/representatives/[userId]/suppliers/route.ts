import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ userId: string }> };

const putSchema = z.object({ supplierCompanyIds: z.array(z.string()) });

async function assertRepresentative(userId: string) {
	const target = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true, role: true },
	});
	return target && target.role === "REPRESENTATIVE" ? target : null;
}

// Lista todas as empresas fornecedoras + quais estão vinculadas ao representante.
export async function GET(_request: Request, { params }: RouteParams) {
	try {
		await requireAuth(["ADMIN"]);
		const { userId } = await params;
		const target = await assertRepresentative(userId);
		if (!target) {
			return NextResponse.json(
				{ error: "Representante não encontrado" },
				{ status: 404 },
			);
		}

		const [all, links] = await Promise.all([
			prisma.company.findMany({
				where: { type: "SUPPLIER", deletedAt: null },
				select: { id: true, name: true },
				orderBy: { name: "asc" },
			}),
			prisma.representativeSupplier.findMany({
				where: { representativeId: userId },
				select: { supplierCompanyId: true },
			}),
		]);

		return NextResponse.json({
			all,
			linked: links.map((l) => l.supplierCompanyId),
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Get representative suppliers error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// Define o conjunto completo de fornecedores que o representante representa.
export async function PUT(request: Request, { params }: RouteParams) {
	try {
		await requireAuth(["ADMIN"]);
		const { userId } = await params;
		const target = await assertRepresentative(userId);
		if (!target) {
			return NextResponse.json(
				{ error: "Representante não encontrado" },
				{ status: 404 },
			);
		}

		const parsed = putSchema.safeParse(await request.json());
		if (!parsed.success) {
			return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
		}
		const desired = [...new Set(parsed.data.supplierCompanyIds)];

		// Garante que todos os ids são empresas fornecedoras válidas.
		const valid = await prisma.company.findMany({
			where: { id: { in: desired }, type: "SUPPLIER", deletedAt: null },
			select: { id: true },
		});
		const validIds = valid.map((c) => c.id);

		await prisma.$transaction([
			prisma.representativeSupplier.deleteMany({
				where: {
					representativeId: userId,
					supplierCompanyId: {
						notIn: validIds.length ? validIds : ["__none__"],
					},
				},
			}),
			prisma.representativeSupplier.createMany({
				data: validIds.map((supplierCompanyId) => ({
					representativeId: userId,
					supplierCompanyId,
				})),
				skipDuplicates: true,
			}),
		]);

		return NextResponse.json({ success: true, linked: validIds });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Set representative suppliers error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
