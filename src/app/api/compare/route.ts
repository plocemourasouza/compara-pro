import { type NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { cache, PriceCompareCache } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { ErrorFactory } from "@/lib/errors";
import {
	createAuthError,
	generateRequestId,
	withErrorHandler,
} from "@/lib/middleware/error-handler";
import { OptimizedProductMatcher } from "@/lib/services/optimized-product-matcher";

export const GET = withErrorHandler(async (request: NextRequest) => {
	const requestId = generateRequestId();
	const startTime = performance.now();

	// Extract upload ID from query params for comparison creation
	const { searchParams } = new URL(request.url);
	const uploadId = searchParams.get("uploadId");
	const useOptimized = searchParams.get("optimized") === "true";

	// Verificar autorização
	const authHeader = request.headers.get("authorization");
	const token = authHeader?.replace("Bearer ", "");

	if (!token) {
		throw createAuthError("missing", undefined, requestId);
	}

	let userId: string;
	try {
		const decoded = verifyToken(token) as { userId: string };
		userId = decoded.userId;
	} catch (_error) {
		throw createAuthError("invalid", undefined, requestId);
	}

	// Cache user lookup
	const userCacheKey = PriceCompareCache.keys.user(userId);
	let user = cache.users.get(userCacheKey);

	if (!user) {
		user = await prisma.user.findUnique({
			where: { id: userId },
			include: { company: true },
		});

		if (!user) {
			throw ErrorFactory.auth.credentialsInvalid(requestId);
		}

		// Cache user for 15 minutes
		cache.users.set(userCacheKey, user, 15 * 60 * 1000);
	}

	if (!user.company || user.area !== "CLIENT") {
		throw createAuthError(
			"insufficient",
			{ requiredRole: "CLIENT" },
			requestId,
		);
	}

	// If uploadId is provided and optimized flag is true, use the new optimized matcher
	if (uploadId && useOptimized) {
		try {
			const { comparisonId, metrics } =
				await OptimizedProductMatcher.createComparison(
					uploadId,
					user.companyId,
					requestId,
				);

			const comparison = await OptimizedProductMatcher.getComparison(
				comparisonId,
				user.companyId,
				requestId,
			);

			return NextResponse.json({
				success: true,
				data: {
					comparison,
					metrics,
					processingTime: performance.now() - startTime,
				},
				meta: {
					requestId,
					cached: false,
					optimized: true,
				},
			});
		} catch (error) {
			// Fall back to legacy comparison if optimized fails
			console.warn(
				"Optimized comparison failed, falling back to legacy:",
				error,
			);
		}
	}

	// Legacy comparison logic with caching
	const legacyCacheKey = `legacy_comparison:${user.companyId}`;
	const cachedComparison = cache.comparisons.get(legacyCacheKey);

	if (cachedComparison) {
		return NextResponse.json({
			success: true,
			data: cachedComparison,
			meta: {
				requestId,
				cached: true,
				optimized: false,
				processingTime: performance.now() - startTime,
			},
		});
	}

	// Buscar produtos do cliente com query otimizada
	const clientProducts = await prisma.product.findMany({
		where: {
			companyId: user.companyId,
			deletedAt: null,
		},
		select: {
			id: true,
			sku: true,
			code: true,
			name: true,
			price: true,
			category: true,
			unit: true,
		},
	});

	if (clientProducts.length === 0) {
		const emptyResult = {
			message:
				"Nenhum produto encontrado. Faça o upload da sua lista de produtos.",
			comparison: [],
			stats: {
				totalProducts: 0,
				matchedProducts: 0,
				unmatchedProducts: 0,
				totalSuppliers: 0,
			},
		};

		return NextResponse.json({
			success: true,
			data: emptyResult,
			meta: {
				requestId,
				cached: false,
				optimized: false,
				processingTime: performance.now() - startTime,
			},
		});
	}

	// Cache supplier products lookup
	const supplierCacheKey = PriceCompareCache.keys.supplierProducts(true);
	interface CompareSupplierProduct {
		id: string;
		sku: string | null;
		code: string | null;
		name: string;
		price: number | null;
		category: string | null;
		unit: string | null;
		companyId: string;
		company: { id: string; name: string; type: string };
	}
	interface SupplierGroup {
		supplier: CompareSupplierProduct["company"];
		products: Array<{
			id: string;
			sku: string | null;
			code: string | null;
			name: string;
			price: number | null;
		}>;
	}

	let supplierProducts: CompareSupplierProduct[] =
		cache.products.get(supplierCacheKey);

	if (!supplierProducts) {
		supplierProducts = await prisma.product.findMany({
			where: {
				company: {
					type: "SUPPLIER",
				},
				deletedAt: null,
				price: { gt: 0 }, // Only products with valid prices
			},
			select: {
				id: true,
				sku: true,
				code: true,
				name: true,
				price: true,
				category: true,
				unit: true,
				companyId: true,
				company: {
					select: {
						id: true,
						name: true,
						type: true,
					},
				},
			},
		});

		// Cache for 10 minutes
		cache.products.set(supplierCacheKey, supplierProducts, 10 * 60 * 1000);
	}

	// Algoritmo de comparação melhorado
	const comparison = clientProducts.map((clientProduct) => {
		// Encontrar produtos correspondentes nos fornecedores
		const matchingProducts = supplierProducts.filter((supplierProduct) => {
			// Prioridade 1: SKU exato
			if (clientProduct.sku && supplierProduct.sku) {
				if (clientProduct.sku === supplierProduct.sku) return true;
			}

			// Prioridade 2: Código exato
			if (clientProduct.code && supplierProduct.code) {
				if (clientProduct.code === supplierProduct.code) return true;
			}

			// Prioridade 3: Nome exato (case insensitive)
			if (clientProduct.name && supplierProduct.name) {
				return (
					clientProduct.name.toLowerCase().trim() ===
					supplierProduct.name.toLowerCase().trim()
				);
			}

			return false;
		});

		// Encontrar o melhor preço
		const validPrices = matchingProducts
			.map((p) => p.price)
			.filter((price): price is number => price !== null && price > 0);

		const bestPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

		// Agrupar por fornecedor
		const supplierGroups = matchingProducts.reduce(
			(acc: Record<string, SupplierGroup>, product) => {
				let group = acc[product.companyId];
				if (!group) {
					group = { supplier: product.company, products: [] };
					acc[product.companyId] = group;
				}
				group.products.push({
					id: product.id,
					sku: product.sku,
					code: product.code,
					name: product.name,
					price: product.price,
				});
				return acc;
			},
			{} as Record<string, SupplierGroup>,
		);

		return {
			clientProduct: {
				id: clientProduct.id,
				sku: clientProduct.sku,
				code: clientProduct.code,
				name: clientProduct.name,
				price: clientProduct.price,
			},
			matchedCount: matchingProducts.length,
			bestPrice,
			suppliers: Object.values(supplierGroups),
			hasMatches: matchingProducts.length > 0,
		};
	});

	// Estatísticas da comparação
	const stats = {
		totalProducts: clientProducts.length,
		matchedProducts: comparison.filter((c) => c.hasMatches).length,
		unmatchedProducts: comparison.filter((c) => !c.hasMatches).length,
		totalSuppliers: new Set(supplierProducts.map((p) => p.companyId)).size,
	};

	const result = {
		stats,
		comparison,
	};

	// Cache result for 5 minutes
	cache.comparisons.set(legacyCacheKey, result, 5 * 60 * 1000);

	return NextResponse.json({
		success: true,
		data: result,
		meta: {
			requestId,
			cached: false,
			optimized: false,
			processingTime: performance.now() - startTime,
		},
	});
});
