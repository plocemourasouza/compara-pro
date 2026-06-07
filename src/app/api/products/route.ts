import { type NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { createProductSchema } from "@/lib/validations/product";

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search");
		const category = searchParams.get("category");
		const companyId = searchParams.get("companyId");

		const whereClause: Prisma.ProductWhereInput = {
			deletedAt: null,
		};

		// Filter by company based on user role
		if (user.role === "REPRESENTATIVE") {
			// Aggregate across all represented suppliers; allow narrowing to one.
			const ids = await getRepresentedSupplierIds(user);
			whereClause.companyId =
				companyId && companyId !== "all" && ids.includes(companyId)
					? companyId
					: { in: ids };
		} else if (user.role === "CLIENT") {
			// Clients can only see supplier products
			whereClause.company = {
				type: "SUPPLIER",
			};
		}

		// Apply search filter
		if (search) {
			whereClause.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ sku: { contains: search, mode: "insensitive" } },
				{ code: { contains: search, mode: "insensitive" } },
			];
		}

		// Apply category filter
		if (category && category !== "all") {
			whereClause.category = category;
		}

		// Apply company filter (only for ADMIN)
		if (companyId && companyId !== "all" && user.role === "ADMIN") {
			whereClause.companyId = companyId;
		}

		const products = await prisma.product.findMany({
			where: whereClause,
			include: {
				company: {
					select: {
						id: true,
						name: true,
						type: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json({ products });
	} catch (error) {
		console.error("GET /api/products error:", error);
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

		const body = await request.json();

		const validation = createProductSchema.safeParse(body);
		if (!validation.success) {
			return NextResponse.json(
				{ error: "Invalid data", details: validation.error.issues },
				{ status: 400 },
			);
		}

		const { name, sku, code, price, description, category, unit, companyId } =
			validation.data;

		// Determine company ID based on user role
		let finalCompanyId: string | undefined = companyId;
		if (user.role === "REPRESENTATIVE") {
			// Must choose one of the suppliers the representative represents.
			const ids = await getRepresentedSupplierIds(user);
			if (!companyId || !ids.includes(companyId)) {
				return NextResponse.json(
					{ error: "Selecione um fornecedor que você representa" },
					{ status: 403 },
				);
			}
			finalCompanyId = companyId;
		} else if (user.role === "CLIENT") {
			return NextResponse.json(
				{ error: "Clients cannot create products" },
				{ status: 403 },
			);
		}

		if (!finalCompanyId) {
			return NextResponse.json(
				{ error: "Company ID is required" },
				{ status: 400 },
			);
		}

		// Check if product with same SKU already exists in the company
		if (sku) {
			const existingProduct = await prisma.product.findFirst({
				where: {
					sku,
					companyId: finalCompanyId,
					deletedAt: null,
				},
			});

			if (existingProduct) {
				return NextResponse.json(
					{ error: "Produto com este SKU já existe nesta empresa" },
					{ status: 409 },
				);
			}
		}

		// Check if product with same code already exists in the company
		if (code) {
			const existingProduct = await prisma.product.findFirst({
				where: {
					code,
					companyId: finalCompanyId,
					deletedAt: null,
				},
			});

			if (existingProduct) {
				return NextResponse.json(
					{ error: "Produto com este código já existe nesta empresa" },
					{ status: 409 },
				);
			}
		}

		const product = await prisma.product.create({
			data: {
				name,
				sku,
				code,
				price,
				description,
				category,
				unit,
				companyId: finalCompanyId,
			},
			include: {
				company: {
					select: {
						id: true,
						name: true,
						type: true,
					},
				},
			},
		});

		return NextResponse.json({ product }, { status: 201 });
	} catch (error) {
		console.error("POST /api/products error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
