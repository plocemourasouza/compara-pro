import { NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatters } from "@/lib/utils/masks";
import { supplierCompanySchema } from "@/lib/validations/representative";

type RouteParams = { params: Promise<{ id: string }> };

// Detalhe do fornecedor representado: contadores, catálogo ativo e carteira.
export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const ids = await getRepresentedSupplierIds(user);
		if (!ids.includes(id)) {
			return NextResponse.json(
				{ error: "Fornecedor não encontrado" },
				{ status: 404 },
			);
		}
		const agencyId = user.company?.id;

		const [supplier, activeCatalog, clients] = await Promise.all([
			prisma.company.findFirst({
				where: { id, deletedAt: null },
				select: {
					id: true,
					name: true,
					cnpj: true,
					city: true,
					state: true,
					_count: { select: { products: true } },
				},
			}),
			prisma.uploadHistory.findFirst({
				where: {
					companyId: id,
					uploadType: "SUPPLIER_PRODUCTS",
					isActive: true,
				},
				select: { fileName: true, uploadedAt: true },
				orderBy: { uploadedAt: "desc" },
			}),
			prisma.supplierClient.findMany({
				where: {
					supplierCompanyId: id,
					...(agencyId ? { representativeCompanyId: agencyId } : {}),
				},
				orderBy: { createdAt: "desc" },
				select: {
					client: {
						select: {
							id: true,
							name: true,
							cnpj: true,
							city: true,
							state: true,
						},
					},
				},
			}),
		]);

		if (!supplier) {
			return NextResponse.json(
				{ error: "Fornecedor não encontrado" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			supplier: {
				id: supplier.id,
				name: supplier.name,
				cnpj: formatters.redactCnpj(supplier.cnpj),
				city: supplier.city,
				state: supplier.state,
				productCount: supplier._count.products,
				activeCatalog: activeCatalog
					? {
							fileName: activeCatalog.fileName,
							uploadedAt: activeCatalog.uploadedAt,
						}
					: null,
				clients: clients.map((c) => ({
					id: c.client.id,
					name: c.client.name,
					cnpj: formatters.redactCnpj(c.client.cnpj),
					city: c.client.city,
					state: c.client.state,
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
		console.error("Get represented supplier error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// Edita os dados da empresa fornecedora (apenas se representada).
export async function PUT(request: Request, { params }: RouteParams) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE"]);
		const ids = await getRepresentedSupplierIds(user);
		if (!ids.includes(id)) {
			return NextResponse.json(
				{ error: "Fornecedor não encontrado" },
				{ status: 404 },
			);
		}

		const parsed = supplierCompanySchema.safeParse(await request.json());
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
				{ status: 400 },
			);
		}
		const data = parsed.data;
		const cnpj = data.cnpj && data.cnpj.length === 14 ? data.cnpj : null;

		const supplier = await prisma.company.update({
			where: { id },
			data: {
				name: data.name,
				cnpj,
				city: data.city || null,
				state: data.state || null,
			},
			select: { id: true, name: true },
		});
		return NextResponse.json({ supplier });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Update represented supplier error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// Desvincula o fornecedor do representante (não apaga a empresa nem produtos).
export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE"]);
		const agencyId = user.company?.id;
		if (!agencyId) {
			return NextResponse.json(
				{ error: "Representante sem agência associada" },
				{ status: 400 },
			);
		}

		const link = await prisma.representativeSupplier.findUnique({
			where: {
				representativeCompanyId_supplierCompanyId: {
					representativeCompanyId: agencyId,
					supplierCompanyId: id,
				},
			},
		});
		if (!link) {
			return NextResponse.json(
				{ error: "Vínculo não encontrado" },
				{ status: 404 },
			);
		}

		await prisma.representativeSupplier.delete({ where: { id: link.id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Unlink represented supplier error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
