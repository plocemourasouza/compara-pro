import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatters } from "@/lib/utils/masks";
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

		// Enriquecimento dos representantes (agências): CNPJ anonimizado (LGPD) e
		// contagem de pré-pedidos recebidos pelos fornecedores que cada agência representa.
		const repIds = companies
			.filter((c) => c.type === "REPRESENTATIVE")
			.map((c) => c.id);

		if (repIds.length === 0) {
			return NextResponse.json({ companies });
		}

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

		const preOrderCountByRep = new Map<string, number>();
		for (const link of links) {
			const prev = preOrderCountByRep.get(link.representativeCompanyId) ?? 0;
			preOrderCountByRep.set(
				link.representativeCompanyId,
				prev + (countBySupplier.get(link.supplierCompanyId) ?? 0),
			);
		}

		const enriched = companies.map((c) =>
			c.type === "REPRESENTATIVE"
				? {
						...c,
						cnpj: c.cnpj ? formatters.maskCnpj(c.cnpj) : c.cnpj,
						preOrderCount: preOrderCountByRep.get(c.id) ?? 0,
					}
				: c,
		);

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
		} = validation.data;

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
