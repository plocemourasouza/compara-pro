import { type NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const resolvedParams = await params;
	try {
		const user = await requireAuth(["CLIENT"]);

		if (!user.company) {
			return NextResponse.json(
				{ error: "Usuário deve estar associado a uma empresa" },
				{ status: 400 },
			);
		}

		const comparisonId = resolvedParams.id;

		// Buscar comparação
		const comparison = await prisma.comparison.findFirst({
			where: {
				id: comparisonId,
				clientId: user.company.id,
			},
			include: {
				matches: {
					include: {
						clientProduct: true,
						supplierMatches: {
							include: {
								supplierProduct: true,
								supplierCompany: true,
							},
						},
					},
				},
			},
		});

		if (!comparison) {
			return NextResponse.json(
				{ error: "Comparação não encontrada" },
				{ status: 404 },
			);
		}

		// Format response
		const formattedComparison = {
			id: comparison.id,
			totalProducts: comparison.totalProducts,
			matchedProducts: comparison.matchedProducts,
			unmatchedProducts: comparison.unmatchedProducts,
			bestPriceTotal: comparison.bestPriceTotal,
			createdAt: comparison.createdAt,
			matches: comparison.matches.map((match) => ({
				id: match.id,
				clientProduct: {
					id: match.clientProduct.id,
					sku: match.clientProduct.sku,
					code: match.clientProduct.code,
					name: match.clientProduct.name,
					description: match.clientProduct.description,
					category: match.clientProduct.category,
					unit: match.clientProduct.unit,
				},
				matchType: match.matchType,
				confidence: match.confidence,
				bestPrice: match.bestPrice,
				supplierMatches: match.supplierMatches.map((supplierMatch) => ({
					id: supplierMatch.id,
					price: supplierMatch.price,
					product: {
						id: supplierMatch.supplierProduct.id,
						sku: supplierMatch.supplierProduct.sku,
						code: supplierMatch.supplierProduct.code,
						name: supplierMatch.supplierProduct.name,
						description: supplierMatch.supplierProduct.description,
						price: supplierMatch.supplierProduct.price,
					},
					supplier: {
						id: supplierMatch.supplierCompany.id,
						name: supplierMatch.supplierCompany.name,
						type: supplierMatch.supplierCompany.type,
					},
				})),
			})),
		};

		return NextResponse.json(formattedComparison);
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Get comparison error:", error);

		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
