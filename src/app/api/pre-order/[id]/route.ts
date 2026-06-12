import { type NextRequest, NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/pre-order/[id] — detalhe com itens (para a modal de detalhe).
export async function GET(_request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		const user = await requireAuth(["CLIENT", "REPRESENTATIVE", "ADMIN"]);

		const preOrder = await prisma.preOrder.findUnique({
			where: { id },
			include: {
				client: { select: { id: true, name: true } },
				supplier: { select: { id: true, name: true } },
				items: {
					where: { deletedAt: null },
					include: {
						product: { select: { name: true, sku: true, code: true } },
					},
				},
			},
		});

		if (!preOrder) {
			return NextResponse.json(
				{ error: "Pré-pedido não encontrado" },
				{ status: 404 },
			);
		}

		// Admin vê qualquer pré-pedido; cliente só os da própria empresa;
		// representante só os de fornecedores que representa.
		if (user.area === "CLIENT" && preOrder.clientId !== user.company?.id) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}
		if (user.area === "REPRESENTATIVE") {
			const ids = await getRepresentedSupplierIds(user);
			if (!ids.includes(preOrder.supplierId)) {
				return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
			}
		}

		return NextResponse.json({
			preOrder: {
				id: preOrder.id,
				status: preOrder.status,
				totalAmount: preOrder.totalAmount,
				notes: preOrder.notes,
				createdAt: preOrder.createdAt,
				respondedAt: preOrder.respondedAt,
				client: preOrder.client,
				supplier: preOrder.supplier,
				itemCount: preOrder.items.length,
				totalQuantity: preOrder.items.reduce((sum, i) => sum + i.quantity, 0),
				items: preOrder.items.map((i) => ({
					id: i.id,
					name: i.product.name,
					sku: i.product.sku,
					code: i.product.code,
					quantity: i.quantity,
					price: i.price,
					totalPrice: i.totalPrice,
				})),
			},
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Get pre-order error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
