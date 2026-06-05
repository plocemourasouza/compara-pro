import { type NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { updateProductSchema } from "@/lib/validations/product";

type RouteParams = { params: Promise<{ id: string }> };

const productSelect = {
	id: true,
	name: true,
	sku: true,
	code: true,
	price: true,
	description: true,
	category: true,
	unit: true,
	companyId: true,
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

// GET /api/products/[id]
export async function GET(_request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		const user = await requireAuth(["ADMIN", "SUPPLIER"]);
		const product = await prisma.product.findFirst({
			where: { id, deletedAt: null },
			select: productSelect,
		});
		if (!product) {
			return NextResponse.json(
				{ error: "Produto não encontrado" },
				{ status: 404 },
			);
		}
		if (user.role === "SUPPLIER" && product.companyId !== user.company?.id) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}
		return NextResponse.json({ product });
	} catch (error) {
		return handleError(error, "Get product error:");
	}
}

// PUT /api/products/[id]
export async function PUT(request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		const user = await requireAuth(["ADMIN", "SUPPLIER"]);

		const body = await request.json();
		const parsed = updateProductSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Dados inválidos", details: parsed.error.issues },
				{ status: 400 },
			);
		}

		const existing = await prisma.product.findFirst({
			where: { id, deletedAt: null },
			select: { id: true, companyId: true },
		});
		if (!existing) {
			return NextResponse.json(
				{ error: "Produto não encontrado" },
				{ status: 404 },
			);
		}
		if (user.role === "SUPPLIER" && existing.companyId !== user.company?.id) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		// Supplier always writes to its own company; admin may target a company.
		const finalCompanyId =
			user.role === "SUPPLIER"
				? user.company?.id
				: (parsed.data.companyId ?? existing.companyId);
		if (!finalCompanyId) {
			return NextResponse.json(
				{ error: "Empresa é obrigatória" },
				{ status: 400 },
			);
		}

		// Unique SKU/code within the company (excluding this product).
		for (const field of ["sku", "code"] as const) {
			const value = parsed.data[field];
			if (!value) continue;
			const dup = await prisma.product.findFirst({
				where: {
					[field]: value,
					companyId: finalCompanyId,
					id: { not: id },
					deletedAt: null,
				},
				select: { id: true },
			});
			if (dup) {
				return NextResponse.json(
					{ error: `Produto com este ${field} já existe nesta empresa` },
					{ status: 409 },
				);
			}
		}

		const { companyId: _ignored, ...rest } = parsed.data;
		const product = await prisma.product.update({
			where: { id },
			data: { ...rest, companyId: finalCompanyId },
			select: productSelect,
		});
		return NextResponse.json({
			message: "Produto atualizado com sucesso",
			product,
		});
	} catch (error) {
		return handleError(error, "Update product error:");
	}
}

// DELETE /api/products/[id] — soft delete
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		const user = await requireAuth(["ADMIN", "SUPPLIER"]);

		const existing = await prisma.product.findFirst({
			where: { id, deletedAt: null },
			select: { id: true, companyId: true },
		});
		if (!existing) {
			return NextResponse.json(
				{ error: "Produto não encontrado" },
				{ status: 404 },
			);
		}
		if (user.role === "SUPPLIER" && existing.companyId !== user.company?.id) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const usedInPreOrder = await prisma.preOrderItem.findFirst({
			where: { productId: id },
			select: { id: true },
		});
		if (usedInPreOrder) {
			return NextResponse.json(
				{
					error: "Não é possível excluir um produto usado em pré-pedidos",
				},
				{ status: 400 },
			);
		}

		await prisma.product.update({
			where: { id },
			data: { deletedAt: new Date() },
		});
		return NextResponse.json({ message: "Produto excluído com sucesso" });
	} catch (error) {
		return handleError(error, "Delete product error:");
	}
}
