import { type NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth(["ADMIN", "REPRESENTATIVE", "CLIENT"]);

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);
		const uploadType = searchParams.get("type") as
			| "SUPPLIER_PRODUCTS"
			| "CLIENT_REQUIREMENTS"
			| null;

		// Admin vê o histórico de todas as empresas (filtro opcional ?companyId);
		// representante vê o de todos os fornecedores representados (com ?companyId
		// opcional para um deles); comprador vê apenas o da própria empresa.
		const where: Prisma.UploadHistoryWhereInput = {};
		const companyIdParam = searchParams.get("companyId");
		if (user.role === "ADMIN") {
			if (companyIdParam) {
				where.companyId = companyIdParam;
			}
		} else if (user.role === "REPRESENTATIVE") {
			const ids = await getRepresentedSupplierIds(user);
			where.companyId =
				companyIdParam && ids.includes(companyIdParam)
					? companyIdParam
					: { in: ids };
		} else {
			if (!user.company) {
				return NextResponse.json(
					{ error: "Usuário deve estar associado a uma empresa" },
					{ status: 400 },
				);
			}
			where.companyId = user.company.id;
		}

		if (uploadType) {
			where.uploadType = uploadType;
		}

		// Get uploads with pagination
		const [uploads, total] = await Promise.all([
			prisma.uploadHistory.findMany({
				where,
				orderBy: { uploadedAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
				select: {
					id: true,
					fileName: true,
					fileSize: true,
					uploadType: true,
					status: true,
					isActive: true,
					priceChangeIndicator: true,
					totalRows: true,
					processedRows: true,
					errorRows: true,
					uploadedAt: true,
					processedAt: true,
					company: { select: { id: true, name: true } },
				},
			}),
			prisma.uploadHistory.count({ where }),
		]);

		return NextResponse.json({
			uploads,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get upload history error:", error);

		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}

		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
