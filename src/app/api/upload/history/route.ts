import { type NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth(["SUPPLIER", "CLIENT"]);

		if (!user.company) {
			return NextResponse.json(
				{ error: "Usuário deve estar associado a uma empresa" },
				{ status: 400 },
			);
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);
		const uploadType = searchParams.get("type") as
			| "SUPPLIER_PRODUCTS"
			| "CLIENT_REQUIREMENTS"
			| null;

		// Build where clause
		const where: Prisma.UploadHistoryWhereInput = {
			companyId: user.company.id,
		};

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
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
