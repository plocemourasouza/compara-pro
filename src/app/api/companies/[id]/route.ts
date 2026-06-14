import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { updateCompanySchema } from "@/lib/validations/company";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const resolvedParams = await params;
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.area !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const company = await prisma.company.findFirst({
			where: {
				id: resolvedParams.id,
				deletedAt: null,
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
					take: 10,
				},
				_count: {
					select: {
						users: true,
						products: true,
					},
				},
			},
		});

		if (!company) {
			return NextResponse.json({ error: "Company not found" }, { status: 404 });
		}

		return NextResponse.json({ company });
	} catch (error) {
		console.error("GET /api/companies/[id] error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const resolvedParams = await params;
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.area !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const body = await request.json();

		const validation = updateCompanySchema.safeParse(body);
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

		// Check if company exists
		const existingCompany = await prisma.company.findFirst({
			where: {
				id: resolvedParams.id,
				deletedAt: null,
			},
		});

		if (!existingCompany) {
			return NextResponse.json({ error: "Company not found" }, { status: 404 });
		}

		// Check if another company with same CNPJ or name already exists
		const duplicateCompany = await prisma.company.findFirst({
			where: {
				OR: [
					{
						cnpj: cnpj,
						id: {
							not: resolvedParams.id,
						},
						deletedAt: null,
					},
					{
						name: {
							equals: name,
							mode: "insensitive",
						},
						id: {
							not: resolvedParams.id,
						},
						deletedAt: null,
					},
				],
			},
		});

		if (duplicateCompany) {
			const errorMessage =
				duplicateCompany.cnpj === cnpj
					? "Empresa com este CNPJ já existe"
					: "Empresa com este nome já existe";
			return NextResponse.json({ error: errorMessage }, { status: 409 });
		}

		const company = await prisma.company.update({
			where: {
				id: resolvedParams.id,
			},
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

		return NextResponse.json({ company });
	} catch (error) {
		console.error("PUT /api/companies/[id] error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const resolvedParams = await params;
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.area !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Check if company exists
		const existingCompany = await prisma.company.findFirst({
			where: {
				id: resolvedParams.id,
				deletedAt: null,
			},
			include: {
				users: {
					where: {
						deletedAt: null,
					},
				},
				products: {
					where: {
						deletedAt: null,
					},
				},
			},
		});

		if (!existingCompany) {
			return NextResponse.json({ error: "Company not found" }, { status: 404 });
		}

		// Check if company has users or products
		if (existingCompany.users.length > 0) {
			return NextResponse.json(
				{ error: "Não é possível excluir uma empresa que possui usuários" },
				{ status: 400 },
			);
		}

		if (existingCompany.products.length > 0) {
			return NextResponse.json(
				{ error: "Não é possível excluir uma empresa que possui produtos" },
				{ status: 400 },
			);
		}

		// Soft delete the company
		await prisma.company.update({
			where: {
				id: resolvedParams.id,
			},
			data: {
				deletedAt: new Date(),
			},
		});

		return NextResponse.json({ message: "Company deleted successfully" });
	} catch (error) {
		console.error("DELETE /api/companies/[id] error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
