import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth(["CLIENT"]);

		if (!user.company) {
			return NextResponse.json(
				{ error: "Usuário deve estar associado a uma empresa" },
				{ status: 400 },
			);
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);

		// Get comparisons with pagination
		const [comparisons, total] = await Promise.all([
			prisma.comparison.findMany({
				where: { clientId: user.company.id },
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: limit,
				include: {
					clientUpload: {
						select: {
							fileName: true,
							uploadedAt: true,
						},
					},
				},
			}),
			prisma.comparison.count({
				where: { clientId: user.company.id },
			}),
		]);

		const formattedComparisons = comparisons.map((comparison) => ({
			id: comparison.id,
			totalProducts: comparison.totalProducts,
			matchedProducts: comparison.matchedProducts,
			unmatchedProducts: comparison.unmatchedProducts,
			bestPriceTotal: comparison.bestPriceTotal,
			priceChangeIndicator: comparison.priceChangeIndicator,
			createdAt: comparison.createdAt,
			upload: {
				fileName: comparison.clientUpload.fileName,
				uploadedAt: comparison.clientUpload.uploadedAt,
			},
		}));

		return NextResponse.json({
			comparisons: formattedComparisons,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get comparison history error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
