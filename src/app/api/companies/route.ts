import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatters } from "@/lib/utils/masks";
import { normalizeCompanyData } from "@/lib/utils/normalize";
import { createCompanySchema } from "@/lib/validations/company";

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.area !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Filtro opcional por tipo: ?type=CLIENT,SUPPLIER ou ?type=REPRESENTATIVE.
		// Ausente → todos os tipos (comportamento anterior).
		const VALID_TYPES = ["SUPPLIER", "CLIENT", "REPRESENTATIVE"] as const;
		const typeParam = request.nextUrl.searchParams.get("type");
		const requestedTypes = typeParam
			?.split(",")
			.map((t) => t.trim().toUpperCase())
			.filter((t): t is (typeof VALID_TYPES)[number] =>
				(VALID_TYPES as readonly string[]).includes(t),
			);

		const companies = await prisma.company.findMany({
			where: {
				deletedAt: null,
				...(requestedTypes && requestedTypes.length > 0
					? { type: { in: requestedTypes } }
					: {}),
			},
			select: {
				id: true,
				name: true,
				legalName: true,
				cnpj: true,
				type: true,
				status: true,
				taxRegime: true,
				email: true,
				phone: true,
				responsibleName: true,
				responsibleEmail: true,
				responsiblePhone: true,
				addressType: true,
				street: true,
				number: true,
				neighborhood: true,
				city: true,
				state: true,
				zipCode: true,
				addressReference: true,
				createdAt: true,
				updatedAt: true,
				users: {
					where: {
						deletedAt: null,
					},
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				products: {
					where: {
						deletedAt: null,
					},
					select: {
						id: true,
						name: true,
						sku: true,
						code: true,
					},
					take: 5, // Limita para performance
				},
				_count: {
					select: {
						users: true,
						products: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		// Contagem de pré-pedidos recebidos pelos fornecedores que cada agência
		// representa — só faz sentido p/ representantes presentes no resultado.
		const repIds = companies
			.filter((c) => c.type === "REPRESENTATIVE")
			.map((c) => c.id);

		const preOrderCountByRep = new Map<string, number>();
		const productListCountByRep = new Map<string, number>();
		if (repIds.length > 0) {
			const links = await prisma.representativeSupplier.findMany({
				where: { representativeCompanyId: { in: repIds } },
				select: { representativeCompanyId: true, supplierCompanyId: true },
			});

			const supplierIds = [...new Set(links.map((l) => l.supplierCompanyId))];
			const grouped =
				supplierIds.length > 0
					? await prisma.preOrder.groupBy({
							by: ["supplierId"],
							where: { supplierId: { in: supplierIds }, deletedAt: null },
							_count: { _all: true },
						})
					: [];
			const countBySupplier = new Map(
				grouped.map((g) => [g.supplierId, g._count._all]),
			);

			for (const link of links) {
				const prev = preOrderCountByRep.get(link.representativeCompanyId) ?? 0;
				preOrderCountByRep.set(
					link.representativeCompanyId,
					prev + (countBySupplier.get(link.supplierCompanyId) ?? 0),
				);
			}

			// Listas de produtos enviadas (uploads SUPPLIER_PRODUCTS) pelos
			// fornecedores que cada agência representa — total de envios.
			const uploadsGrouped =
				supplierIds.length > 0
					? await prisma.uploadHistory.groupBy({
							by: ["companyId"],
							where: {
								companyId: { in: supplierIds },
								uploadType: "SUPPLIER_PRODUCTS",
							},
							_count: { _all: true },
						})
					: [];
			const uploadsBySupplier = new Map(
				uploadsGrouped.map((g) => [g.companyId, g._count._all]),
			);

			for (const link of links) {
				const prev =
					productListCountByRep.get(link.representativeCompanyId) ?? 0;
				productListCountByRep.set(
					link.representativeCompanyId,
					prev + (uploadsBySupplier.get(link.supplierCompanyId) ?? 0),
				);
			}
		}

		// CNPJ anonimizado por padrão (LGPD) p/ TODOS os tipos e SEMPRE (mesmo sem
		// representantes no resultado); reveal sob demanda via /api/companies/[id]/cnpj.
		const enriched = companies.map((c) => ({
			...c,
			cnpj: formatters.redactCnpj(c.cnpj),
			...(c.type === "REPRESENTATIVE"
				? {
						preOrderCount: preOrderCountByRep.get(c.id) ?? 0,
						productListCount: productListCountByRep.get(c.id) ?? 0,
					}
				: {}),
		}));

		return NextResponse.json({ companies: enriched });
	} catch (error) {
		console.error("GET /api/companies error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.area !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();

		const validation = createCompanySchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{ error: "Invalid data", details: validation.error.issues },
				{ status: 400 },
			);
		}

		const {
			name,
			legalName,
			cnpj,
			type,
			status,
			taxRegime,
			email,
			phone,
			responsibleName,
			responsibleEmail,
			responsiblePhone,
			addressType,
			street,
			number,
			neighborhood,
			city,
			state,
			zipCode,
			addressReference,
		} = normalizeCompanyData(validation.data);

		// Check if company with same CNPJ already exists
		const existingCompany = await prisma.company.findFirst({
			where: {
				OR: [
					{
						cnpj: cnpj,
						deletedAt: null,
					},
					{
						name: {
							equals: name,
							mode: "insensitive",
						},
						deletedAt: null,
					},
				],
			},
		});

		if (existingCompany) {
			const errorMessage =
				existingCompany.cnpj === cnpj
					? "Empresa com este CNPJ já existe"
					: "Empresa com este nome já existe";
			return NextResponse.json({ error: errorMessage }, { status: 409 });
		}

		const company = await prisma.company.create({
			data: {
				name,
				legalName,
				cnpj,
				type,
				...(status ? { status } : {}),
				taxRegime,
				email: email || null,
				phone: phone || null,
				responsibleName,
				responsibleEmail,
				responsiblePhone,
				addressType,
				street,
				number,
				neighborhood,
				city,
				state,
				zipCode,
				addressReference: addressReference || null,
			},
			select: {
				id: true,
				name: true,
				legalName: true,
				cnpj: true,
				type: true,
				status: true,
				taxRegime: true,
				email: true,
				phone: true,
				responsibleName: true,
				responsibleEmail: true,
				responsiblePhone: true,
				addressType: true,
				street: true,
				number: true,
				neighborhood: true,
				city: true,
				state: true,
				zipCode: true,
				addressReference: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return NextResponse.json({ company }, { status: 201 });
	} catch (error) {
		console.error("POST /api/companies error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
