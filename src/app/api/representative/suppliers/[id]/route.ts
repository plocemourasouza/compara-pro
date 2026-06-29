import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";
import { scopedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatters, masks } from "@/lib/utils/masks";
import { supplierCompanySchema } from "@/lib/validations/representative";

type RouteParams = { params: Promise<{ id: string }> };

// Detalhe do fornecedor representado: cadastro, contadores, catálogo ativo e carteira.
export async function GET(_request: Request, { params }: RouteParams) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const ids = await scopedSupplierIds(user);
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
					legalName: true,
					cnpj: true,
					email: true,
					phone: true,
					zipCode: true,
					street: true,
					number: true,
					neighborhood: true,
					city: true,
					state: true,
					responsibleName: true,
					responsibleEmail: true,
					responsiblePhone: true,
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
					// Representante vê só a sua carteira; admin vê toda.
					...(user.area === "ADMIN" || !agencyId
						? {}
						: { representativeCompanyId: agencyId }),
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
				legalName: supplier.legalName,
				// CNPJ completo: o dono (rep/admin) está vendo o fornecedor.
				cnpj: supplier.cnpj ? formatters.cnpj(supplier.cnpj) : null,
				email: supplier.email,
				phone: supplier.phone,
				zipCode: supplier.zipCode,
				street: supplier.street,
				number: supplier.number,
				neighborhood: supplier.neighborhood,
				city: supplier.city,
				state: supplier.state,
				responsibleName: supplier.responsibleName,
				responsibleEmail: supplier.responsibleEmail,
				responsiblePhone: supplier.responsiblePhone,
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

// Edita os dados da empresa fornecedora (CNPJ é imutável — empresa compartilhada).
export async function PUT(request: Request, { params }: RouteParams) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const ids = await scopedSupplierIds(user);
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
		const zip = data.zipCode ? masks.removeNonDigits(data.zipCode) : "";

		// Não altera o CNPJ (chave da empresa compartilhada entre agências).
		const supplier = await prisma.company.update({
			where: { id },
			data: {
				name: data.name,
				legalName: data.legalName || null,
				street: data.street || null,
				number: data.number || null,
				neighborhood: data.neighborhood || null,
				city: data.city || null,
				state: data.state ? data.state.toUpperCase() : null,
				zipCode: zip.length === 8 ? zip : null,
				email: data.email || null,
				phone: data.phone ? masks.removeNonDigits(data.phone) || null : null,
				responsibleName: data.responsibleName || null,
				responsibleEmail: data.responsibleEmail || null,
				responsiblePhone: data.responsiblePhone
					? masks.removeNonDigits(data.responsiblePhone) || null
					: null,
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
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2002"
		) {
			return NextResponse.json(
				{ error: "CNPJ já cadastrado em outra empresa" },
				{ status: 409 },
			);
		}
		console.error("Update represented supplier error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// Desvincula o fornecedor (não apaga a empresa nem produtos).
// REPRESENTATIVE remove o próprio vínculo; ADMIN remove todos os vínculos do fornecedor.
export async function DELETE(_request: Request, { params }: RouteParams) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);

		if (user.area === "ADMIN") {
			await prisma.representativeSupplier.deleteMany({
				where: { supplierCompanyId: id },
			});
			return NextResponse.json({ success: true });
		}

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
