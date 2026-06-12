import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { createCompanySchema } from "@/lib/validations/company";

export async function GET(_request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.area !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const companies = await prisma.company.findMany({
			where: {
				deletedAt: null,
			},
			select: {
				id: true,
				name: true,
				legalName: true,
				cnpj: true,
				type: true,
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

		return NextResponse.json({ companies });
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
