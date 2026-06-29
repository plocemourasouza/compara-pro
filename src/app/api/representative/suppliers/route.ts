import { NextResponse } from "next/server";
import { scopedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatters, masks } from "@/lib/utils/masks";
import {
	type SupplierCompanyValues,
	supplierCompanySchema,
} from "@/lib/validations/representative";

/** Campos de cadastro da empresa fornecedora gravados em create/update. */
function companyDataFrom(data: SupplierCompanyValues) {
	const zip = data.zipCode ? masks.removeNonDigits(data.zipCode) : "";
	return {
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
	};
}

// Lista os fornecedores que o representante representa, com contadores.
export async function GET() {
	try {
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		// ADMIN (suporte) vê todos os fornecedores; representante só os que representa.
		const ids = await scopedSupplierIds(user);
		if (ids.length === 0) {
			return NextResponse.json({ suppliers: [] });
		}

		const [suppliers, catalogs] = await Promise.all([
			prisma.company.findMany({
				where: { id: { in: ids }, deletedAt: null },
				orderBy: { name: "asc" },
				select: {
					id: true,
					name: true,
					cnpj: true,
					city: true,
					state: true,
					_count: {
						select: { products: true, carteiraClientes: true },
					},
				},
			}),
			prisma.uploadHistory.findMany({
				where: {
					companyId: { in: ids },
					uploadType: "SUPPLIER_PRODUCTS",
					isActive: true,
				},
				select: { companyId: true, uploadedAt: true },
			}),
		]);

		const catalogMap = new Map(
			catalogs.map((c) => [c.companyId, c.uploadedAt]),
		);

		return NextResponse.json({
			suppliers: suppliers.map((s) => ({
				id: s.id,
				name: s.name,
				cnpj: formatters.redactCnpj(s.cnpj),
				city: s.city,
				state: s.state,
				productCount: s._count.products,
				clientCount: s._count.carteiraClientes,
				lastCatalogAt: catalogMap.get(s.id) ?? null,
			})),
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("List represented suppliers error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// Cadastra (ou reaproveita por CNPJ/nome) um fornecedor e o vincula ao representante.
export async function POST(request: Request) {
	try {
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);

		const parsed = supplierCompanySchema.safeParse(await request.json());
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
				{ status: 400 },
			);
		}
		const data = parsed.data;

		// Agência dona do vínculo: ADMIN escolhe; representante usa a própria.
		let agencyId: string;
		if (user.area === "ADMIN") {
			if (!data.representativeCompanyId) {
				return NextResponse.json(
					{ error: "Selecione a agência (representante)" },
					{ status: 400 },
				);
			}
			const agency = await prisma.company.findFirst({
				where: { id: data.representativeCompanyId, type: "REPRESENTATIVE" },
				select: { id: true },
			});
			if (!agency) {
				return NextResponse.json(
					{ error: "Agência inválida" },
					{ status: 400 },
				);
			}
			agencyId = agency.id;
		} else {
			if (!user.company?.id) {
				return NextResponse.json(
					{ error: "Representante sem agência associada" },
					{ status: 400 },
				);
			}
			agencyId = user.company.id;
		}

		const cnpj = data.cnpj && data.cnpj.length === 14 ? data.cnpj : null;
		const companyData = companyDataFrom(data);

		// Reusa empresa fornecedora existente (por CNPJ, senão por nome) ou cria.
		let company = cnpj
			? await prisma.company.findFirst({ where: { cnpj } })
			: await prisma.company.findFirst({
					where: { name: { equals: data.name, mode: "insensitive" } },
				});

		if (company && company.type !== "SUPPLIER") {
			return NextResponse.json(
				{ error: "Empresa já cadastrada como cliente." },
				{ status: 409 },
			);
		}
		if (company) {
			company = await prisma.company.update({
				where: { id: company.id },
				data: companyData,
			});
		} else {
			company = await prisma.company.create({
				data: { ...companyData, cnpj, type: "SUPPLIER" },
			});
		}

		// Vínculo idempotente agência ↔ fornecedor.
		await prisma.representativeSupplier.upsert({
			where: {
				representativeCompanyId_supplierCompanyId: {
					representativeCompanyId: agencyId,
					supplierCompanyId: company.id,
				},
			},
			update: {},
			create: {
				representativeCompanyId: agencyId,
				supplierCompanyId: company.id,
			},
		});

		return NextResponse.json(
			{ supplier: { id: company.id, name: company.name } },
			{ status: 201 },
		);
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Create represented supplier error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
