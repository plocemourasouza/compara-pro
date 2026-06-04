import { type NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { ProductMatcher } from "@/lib/services/product-matcher";

export async function GET(request: NextRequest) {
	try {
		const _user = await requireAuth(["CLIENT", "ADMIN"]);

		const { searchParams } = new URL(request.url);
		const query = searchParams.get("q");
		const supplierId = searchParams.get("supplierId");
		const limit = parseInt(searchParams.get("limit") || "20", 10);

		if (!query || query.trim().length < 2) {
			return NextResponse.json(
				{ error: "Query deve ter pelo menos 2 caracteres" },
				{ status: 400 },
			);
		}

		const products = await ProductMatcher.searchProducts(
			query.trim(),
			supplierId || undefined,
			Math.min(limit, 50), // Max 50 results
		);

		return NextResponse.json({
			products,
			query: query.trim(),
			count: products.length,
		});
	} catch (error) {
		console.error("Search products error:", error);

		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}

		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
