/**
 * Optimized Product Matcher - PriceCompare
 * Versão otimizada com cache, queries melhoradas e error handling granular
 */

import Fuse from "fuse.js";
import type { Prisma } from "@/generated/prisma";
import { cache, cached, PriceCompareCache } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { AppError, ErrorFactory } from "@/lib/errors";
import {
	jaccardSimilarity,
	normalizeString as normalizeStringUtil,
} from "./matching-utils";

/** Minimal shape of a product row returned from DB select queries */
export interface UploadedProductRow {
	id: string;
	sku: string | null;
	code: string | null;
	name: string;
	price: number | null;
	description: string | null;
	category: string | null;
	unit: string | null;
	quantity: number | null;
}

/** Minimal shape of a supplier (Company) returned from DB select queries */
export interface SupplierRow {
	id: string;
	name: string;
	type: string;
}

/** Supplier product enriched with supplier info */
export interface SupplierProductRow extends UploadedProductRow {
	supplier: SupplierRow;
	uploadId: string;
}

export interface OptimizedMatchResult {
	clientProduct: UploadedProductRow;
	supplierMatches: OptimizedSupplierMatchResult[];
	bestMatch?: OptimizedSupplierMatchResult;
	bestPrice?: number;
	matchType: "SKU" | "CODE" | "NAME" | "NONE";
	confidence: number;
	processingTimeMs: number;
}

export interface OptimizedSupplierMatchResult {
	product: SupplierProductRow;
	supplier: SupplierRow;
	matchType: "SKU" | "CODE" | "NAME";
	confidence: number;
	price: number;
	availableQuantity?: number | null;
}

export interface ComparisonMetrics {
	totalProcessingTimeMs: number;
	cacheHitRate: number;
	matchingStats: {
		skuMatches: number;
		codeMatches: number;
		nameMatches: number;
		noMatches: number;
	};
	performanceBreakdown: {
		dbQueryTime: number;
		cacheTime: number;
		matchingTime: number;
		fuzzySearchTime: number;
	};
}

// biome-ignore lint/complexity/noStaticOnlyClass: intentional static utility namespace with @cached decorator
export class OptimizedProductMatcher {
	private static readonly NAME_SIMILARITY_THRESHOLD = 0.7;
	private static readonly FUZZY_SEARCH_THRESHOLD = 0.6;
	private static readonly BATCH_SIZE = 50;
	private static readonly MAX_FUZZY_RESULTS = 10;

	/**
	 * Create comparison with optimizations and comprehensive error handling
	 */
	static async createComparison(
		clientUploadId: string,
		clientId: string,
		requestId?: string,
	): Promise<{ comparisonId: string; metrics: ComparisonMetrics }> {
		const startTime = performance.now();
		const metrics: ComparisonMetrics = {
			totalProcessingTimeMs: 0,
			cacheHitRate: 0,
			matchingStats: {
				skuMatches: 0,
				codeMatches: 0,
				nameMatches: 0,
				noMatches: 0,
			},
			performanceBreakdown: {
				dbQueryTime: 0,
				cacheTime: 0,
				matchingTime: 0,
				fuzzySearchTime: 0,
			},
		};

		try {
			// 1. Validate and get client upload with optimized query
			const dbStart = performance.now();
			const clientUpload =
				await OptimizedProductMatcher.getClientUploadOptimized(
					clientUploadId,
					clientId,
					requestId,
				);
			metrics.performanceBreakdown.dbQueryTime += performance.now() - dbStart;

			// 2. Get active supplier products with caching
			const cacheStart = performance.now();
			const supplierProducts =
				await OptimizedProductMatcher.getActiveSupplierProductsCached(
					requestId,
				);
			metrics.performanceBreakdown.cacheTime += performance.now() - cacheStart;

			// 3. Perform optimized matching
			const matchStart = performance.now();
			const { matches, matchingStats } =
				await OptimizedProductMatcher.matchProductsOptimized(
					clientUpload.products,
					supplierProducts,
					metrics,
				);
			metrics.performanceBreakdown.matchingTime =
				performance.now() - matchStart;
			metrics.matchingStats = matchingStats;

			// 4. Calculate statistics efficiently
			const totalProducts = clientUpload.products.length;
			const matchedProducts = matches.filter(
				(m) => m.matchType !== "NONE",
			).length;
			const unmatchedProducts = totalProducts - matchedProducts;
			const bestPriceTotal = matches
				.filter((m) => m.bestPrice)
				// biome-ignore lint/style/noNonNullAssertion: bestPrice is guaranteed by the filter above
				.reduce((sum, m) => sum + m.bestPrice!, 0);

			// 5. Create comparison in transaction
			const dbTransactionStart = performance.now();
			const comparison = await prisma.$transaction(async (tx) => {
				const newComparison = await tx.comparison.create({
					data: {
						clientUploadId,
						clientId,
						totalProducts,
						matchedProducts,
						unmatchedProducts,
						bestPriceTotal,
					},
				});

				// Batch insert matches for better performance
				await OptimizedProductMatcher.batchInsertMatches(
					tx,
					newComparison.id,
					matches,
				);

				return newComparison;
			});
			metrics.performanceBreakdown.dbQueryTime +=
				performance.now() - dbTransactionStart;

			// 6. Cache the result
			const cacheKey = PriceCompareCache.keys.comparison(comparison.id);
			cache.comparisons.set(
				cacheKey,
				{
					...comparison,
					matches,
					metrics,
				},
				10 * 60 * 1000,
			); // 10 minutes cache

			metrics.totalProcessingTimeMs = performance.now() - startTime;

			return {
				comparisonId: comparison.id,
				metrics,
			};
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}

			console.error("Optimized comparison creation error:", error);
			throw ErrorFactory.business.matchingFailed(
				"Erro interno durante criação da comparação",
				{
					clientUploadId,
					clientId,
					processingTime: performance.now() - startTime,
				},
				requestId,
			);
		}
	}

	/**
	 * Get client upload with optimized query
	 */
	private static async getClientUploadOptimized(
		uploadId: string,
		clientId: string,
		requestId?: string,
	) {
		const cacheKey = PriceCompareCache.keys.comparisonByUpload(uploadId);
		const cached = cache.comparisons.get(cacheKey);

		if (cached) {
			return cached;
		}

		const clientUpload = await prisma.uploadHistory.findFirst({
			where: {
				id: uploadId,
				companyId: clientId,
				uploadType: "CLIENT_REQUIREMENTS",
				status: "COMPLETED",
			},
			include: {
				products: {
					where: {
						// Only get products with essential data for matching
						OR: [
							{ sku: { not: null } },
							{ code: { not: null } },
							{ name: { not: "" } },
						],
					},
					select: {
						id: true,
						sku: true,
						code: true,
						name: true,
						price: true,
						description: true,
						category: true,
						unit: true,
						quantity: true,
					},
				},
			},
		});

		if (!clientUpload) {
			throw ErrorFactory.business.companyNotFound(clientId, requestId);
		}

		// Cache for future use
		cache.comparisons.set(cacheKey, clientUpload, 5 * 60 * 1000);

		return clientUpload;
	}

	/**
	 * Get active supplier products with aggressive caching
	 */
	@cached(
		cache.products,
		() => PriceCompareCache.keys.supplierProducts(true),
		15 * 60 * 1000, // 15 minutes cache
	)
	private static async getActiveSupplierProductsCached(requestId?: string) {
		try {
			// Supplier catalog (products) is the single source for matching.
			const products = await prisma.product.findMany({
				where: {
					isActive: true,
					deletedAt: null,
					price: { gt: 0 },
					company: { type: "SUPPLIER" },
					OR: [
						{ sku: { not: null } },
						{ code: { not: null } },
						{ name: { not: "" } },
					],
				},
				select: {
					id: true,
					sku: true,
					code: true,
					name: true,
					price: true,
					description: true,
					category: true,
					unit: true,
					quantity: true,
					lastUploadId: true,
					company: { select: { id: true, name: true, type: true } },
				},
			});

			return products.map((product) => ({
				id: product.id,
				sku: product.sku,
				code: product.code,
				name: product.name,
				price: product.price,
				description: product.description,
				category: product.category,
				unit: product.unit,
				quantity: product.quantity,
				supplier: product.company,
				uploadId: product.lastUploadId ?? "",
			}));
		} catch (error) {
			console.error("Error fetching supplier products:", error);
			throw ErrorFactory.database.recordNotFound(
				"SupplierProducts",
				"active",
				requestId,
			);
		}
	}

	/**
	 * Optimized matching with batching and performance tracking
	 */
	private static async matchProductsOptimized(
		clientProducts: UploadedProductRow[],
		supplierProducts: SupplierProductRow[],
		metrics: ComparisonMetrics,
	): Promise<{
		matches: OptimizedMatchResult[];
		matchingStats: ComparisonMetrics["matchingStats"];
	}> {
		const results: OptimizedMatchResult[] = [];
		const matchingStats = {
			skuMatches: 0,
			codeMatches: 0,
			nameMatches: 0,
			noMatches: 0,
		};

		// Pre-build lookup maps for O(1) access instead of O(n) filtering
		const supplierBySku = new Map<string, SupplierProductRow[]>();
		const supplierByCode = new Map<string, SupplierProductRow[]>();
		const supplierByNormalizedName = new Map<string, SupplierProductRow[]>();

		// Build indexes once
		for (const product of supplierProducts) {
			if (product.sku) {
				const normalized = OptimizedProductMatcher.normalizeString(product.sku);
				if (!supplierBySku.has(normalized)) {
					supplierBySku.set(normalized, []);
				}
				supplierBySku.get(normalized)?.push(product);
			}

			if (product.code) {
				const normalized = OptimizedProductMatcher.normalizeString(
					product.code,
				);
				if (!supplierByCode.has(normalized)) {
					supplierByCode.set(normalized, []);
				}
				supplierByCode.get(normalized)?.push(product);
			}

			if (product.name) {
				const normalized = OptimizedProductMatcher.normalizeString(
					product.name,
				);
				if (!supplierByNormalizedName.has(normalized)) {
					supplierByNormalizedName.set(normalized, []);
				}
				supplierByNormalizedName.get(normalized)?.push(product);
			}
		}

		// Create fuzzy search index once (expensive operation)
		const fuzzyStart = performance.now();
		const fuse = new Fuse(supplierProducts, {
			keys: ["name"],
			threshold: OptimizedProductMatcher.FUZZY_SEARCH_THRESHOLD,
			includeScore: true,
			ignoreLocation: true,
			minMatchCharLength: 3,
		});
		metrics.performanceBreakdown.fuzzySearchTime +=
			performance.now() - fuzzyStart;

		// Process in batches to avoid memory issues
		for (
			let i = 0;
			i < clientProducts.length;
			i += OptimizedProductMatcher.BATCH_SIZE
		) {
			const batch = clientProducts.slice(
				i,
				i + OptimizedProductMatcher.BATCH_SIZE,
			);

			for (const clientProduct of batch) {
				const matchStart = performance.now();

				const matchResult = await OptimizedProductMatcher.findMatchesOptimized(
					clientProduct,
					supplierBySku,
					supplierByCode,
					supplierByNormalizedName,
					fuse,
					metrics,
				);

				matchResult.processingTimeMs = performance.now() - matchStart;

				// Update stats
				switch (matchResult.matchType) {
					case "SKU":
						matchingStats.skuMatches++;
						break;
					case "CODE":
						matchingStats.codeMatches++;
						break;
					case "NAME":
						matchingStats.nameMatches++;
						break;
					case "NONE":
						matchingStats.noMatches++;
						break;
				}

				results.push(matchResult);
			}
		}

		return { matches: results, matchingStats };
	}

	/**
	 * Optimized individual product matching
	 */
	private static async findMatchesOptimized(
		clientProduct: UploadedProductRow,
		supplierBySku: Map<string, SupplierProductRow[]>,
		supplierByCode: Map<string, SupplierProductRow[]>,
		supplierByNormalizedName: Map<string, SupplierProductRow[]>,
		fuse: Fuse<SupplierProductRow>,
		metrics: ComparisonMetrics,
	): Promise<OptimizedMatchResult> {
		const supplierMatches: OptimizedSupplierMatchResult[] = [];

		// 1. Exact SKU matching (O(1) lookup)
		if (clientProduct.sku) {
			const normalizedSku = OptimizedProductMatcher.normalizeString(
				clientProduct.sku,
			);
			const skuMatches = supplierBySku.get(normalizedSku) || [];

			for (const supplierProduct of skuMatches) {
				supplierMatches.push({
					product: supplierProduct,
					supplier: supplierProduct.supplier,
					matchType: "SKU",
					confidence: 1.0,
					price: supplierProduct.price || 0,
					availableQuantity: supplierProduct.quantity,
				});
			}
		}

		// 2. Exact CODE matching (O(1) lookup)
		if (supplierMatches.length === 0 && clientProduct.code) {
			const normalizedCode = OptimizedProductMatcher.normalizeString(
				clientProduct.code,
			);
			const codeMatches = supplierByCode.get(normalizedCode) || [];

			for (const supplierProduct of codeMatches) {
				supplierMatches.push({
					product: supplierProduct,
					supplier: supplierProduct.supplier,
					matchType: "CODE",
					confidence: 1.0,
					price: supplierProduct.price || 0,
					availableQuantity: supplierProduct.quantity,
				});
			}
		}

		// 3. Name matching (exact then fuzzy)
		if (supplierMatches.length === 0 && clientProduct.name) {
			// Exact name match first (O(1) lookup)
			const normalizedName = OptimizedProductMatcher.normalizeString(
				clientProduct.name,
			);
			const exactNameMatches =
				supplierByNormalizedName.get(normalizedName) || [];

			for (const supplierProduct of exactNameMatches) {
				supplierMatches.push({
					product: supplierProduct,
					supplier: supplierProduct.supplier,
					matchType: "NAME",
					confidence: 1.0,
					price: supplierProduct.price || 0,
					availableQuantity: supplierProduct.quantity,
				});
			}

			// Fuzzy name matching if no exact match
			if (supplierMatches.length === 0) {
				const fuzzyStart = performance.now();
				const fuzzyResults = fuse
					.search(clientProduct.name)
					.slice(0, OptimizedProductMatcher.MAX_FUZZY_RESULTS);
				metrics.performanceBreakdown.fuzzySearchTime +=
					performance.now() - fuzzyStart;

				for (const result of fuzzyResults) {
					if (
						result.score &&
						1 - result.score >=
							OptimizedProductMatcher.NAME_SIMILARITY_THRESHOLD
					) {
						const similarity =
							OptimizedProductMatcher.calculateJaccardSimilarity(
								normalizedName,
								OptimizedProductMatcher.normalizeString(result.item.name),
							);

						if (
							similarity >= OptimizedProductMatcher.NAME_SIMILARITY_THRESHOLD
						) {
							supplierMatches.push({
								product: result.item,
								supplier: result.item.supplier,
								matchType: "NAME",
								confidence: Math.max(1 - result.score, similarity),
								price: result.item.price || 0,
								availableQuantity: result.item.quantity,
							});
						}
					}
				}
			}
		}

		// Find best match and calculate metrics
		const bestMatch =
			supplierMatches.length > 0
				? supplierMatches.reduce((best, current) =>
						current.confidence > best.confidence ||
						(current.confidence === best.confidence &&
							current.price < best.price)
							? current
							: best,
					)
				: undefined;

		const validPrices = supplierMatches
			.map((m) => m.price)
			.filter((price) => price > 0);

		const bestPrice =
			validPrices.length > 0 ? Math.min(...validPrices) : undefined;

		const matchType = supplierMatches[0]?.matchType ?? "NONE";

		const confidence = bestMatch?.confidence || 0;

		return {
			clientProduct,
			supplierMatches,
			bestMatch,
			bestPrice,
			matchType,
			confidence,
			processingTimeMs: 0, // Will be set by caller
		};
	}

	/**
	 * Batch insert matches for better performance
	 */
	private static async batchInsertMatches(
		tx: Prisma.TransactionClient,
		comparisonId: string,
		matches: OptimizedMatchResult[],
	) {
		const validMatches = matches.filter(
			(m): m is OptimizedMatchResult & { matchType: "SKU" | "CODE" | "NAME" } =>
				m.matchType !== "NONE",
		);

		if (validMatches.length === 0) return;

		// Prepare batch data
		const comparisonMatches = validMatches.map((match) => ({
			comparisonId,
			clientProductId: match.clientProduct.id,
			productName: match.clientProduct.name,
			bestPrice: match.bestPrice,
			bestSupplierId: match.bestMatch?.supplier.id,
			matchType: match.matchType,
			confidence: match.confidence,
		}));

		// Batch insert comparison matches
		const insertedMatches = await tx.comparisonMatch.createManyAndReturn({
			data: comparisonMatches,
		});

		// Prepare supplier matches data
		const supplierMatchesData = [];
		for (let i = 0; i < validMatches.length; i++) {
			const match = validMatches[i];
			const inserted = insertedMatches[i];
			if (!match || !inserted) continue;
			const comparisonMatchId = inserted.id;

			for (const supplierMatch of match.supplierMatches) {
				supplierMatchesData.push({
					comparisonMatchId,
					supplierProductId: supplierMatch.product.id,
					price: supplierMatch.price,
					supplierCompanyId: supplierMatch.supplier.id,
					availableQuantity: supplierMatch.availableQuantity || 0,
				});
			}
		}

		// Batch insert supplier matches
		if (supplierMatchesData.length > 0) {
			await tx.supplierMatch.createMany({
				data: supplierMatchesData,
				skipDuplicates: true,
			});
		}
	}

	/**
	 * Optimized string normalization
	 */
	private static normalizeString(str: string): string {
		return normalizeStringUtil(str);
	}

	/**
	 * Optimized Jaccard similarity calculation
	 */
	private static calculateJaccardSimilarity(
		str1: string,
		str2: string,
	): number {
		return jaccardSimilarity(str1, str2);
	}

	/**
	 * Get cached comparison with optimized query
	 */
	@cached(
		cache.comparisons,
		(comparisonId: string) => PriceCompareCache.keys.comparison(comparisonId),
		15 * 60 * 1000,
	)
	static async getComparison(
		comparisonId: string,
		clientId: string,
		requestId?: string,
	) {
		try {
			const comparison = await prisma.comparison.findFirst({
				where: {
					id: comparisonId,
					clientId: clientId,
				},
				include: {
					matches: {
						include: {
							clientProduct: {
								select: {
									id: true,
									sku: true,
									code: true,
									name: true,
									price: true,
									category: true,
									unit: true,
								},
							},
							supplierMatches: {
								where: { isActive: true },
								include: {
									supplierProduct: {
										select: {
											id: true,
											sku: true,
											code: true,
											name: true,
											price: true,
											category: true,
											unit: true,
											quantity: true,
										},
									},
									supplierCompany: {
										select: {
											id: true,
											name: true,
											type: true,
										},
									},
								},
								orderBy: [{ price: "asc" }, { availableQuantity: "desc" }],
							},
						},
						orderBy: {
							confidence: "desc",
						},
					},
				},
			});

			if (!comparison) {
				throw ErrorFactory.business.comparisonNotFound(comparisonId, requestId);
			}

			return comparison;
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}

			console.error("Get comparison error:", error);
			throw ErrorFactory.database.recordNotFound(
				"Comparison",
				comparisonId,
				requestId,
			);
		}
	}

	/**
	 * Fatia da comparação para UM fornecedor: as indicações do catálogo dele
	 * contra a demanda do cliente + lacunas competitivas + resumo determinístico.
	 * Reusa a comparação global (cria se ainda não existir para o upload).
	 */
	static async getSupplierIndications(
		clientUploadId: string,
		supplierCompanyId: string,
	) {
		const upload = await prisma.uploadHistory.findUnique({
			where: { id: clientUploadId },
			select: { id: true, companyId: true, uploadType: true },
		});
		if (!upload) {
			throw ErrorFactory.business.comparisonNotFound(clientUploadId);
		}
		if (upload.uploadType !== "CLIENT_REQUIREMENTS") {
			throw ErrorFactory.business.comparisonNotFound(clientUploadId);
		}

		const existing = await prisma.comparison.findFirst({
			where: { clientUploadId },
			select: { id: true },
			orderBy: { createdAt: "desc" },
		});
		const comparisonId = existing
			? existing.id
			: (
					await OptimizedProductMatcher.createComparison(
						clientUploadId,
						upload.companyId,
					)
				).comparisonId;

		// Query direta (shape garantido) — usa o scalar supplierCompanyId.
		const full = await prisma.comparison.findUnique({
			where: { id: comparisonId },
			select: {
				totalProducts: true,
				matches: {
					select: {
						matchType: true,
						confidence: true,
						clientProduct: {
							select: { id: true, name: true, sku: true, code: true },
						},
						supplierMatches: {
							select: {
								price: true,
								supplierCompanyId: true,
								supplierProduct: { select: { name: true, sku: true } },
							},
						},
					},
				},
			},
		});
		if (!full) {
			throw ErrorFactory.business.comparisonNotFound(comparisonId);
		}

		// Quantidades da demanda por produto do cliente.
		const demandRows = await prisma.uploadedProduct.findMany({
			where: { uploadId: clientUploadId },
			select: { id: true, quantity: true },
		});
		const qtyByProduct = new Map(demandRows.map((r) => [r.id, r.quantity]));

		const items: Array<{
			clientName: string;
			sku: string | null;
			code: string | null;
			quantity: number | null;
			supplierName: string;
			supplierSku: string | null;
			price: number;
			matchType: string;
			confidence: number;
			bestPrice: number;
			isBest: boolean;
		}> = [];
		const gaps: Array<{
			clientName: string;
			sku: string | null;
			code: string | null;
			quantity: number | null;
			bestPriceElsewhere: number | null;
			otherSuppliers: number;
		}> = [];

		let offeredValue = 0;
		let bestPriceItems = 0;

		for (const match of full.matches) {
			const prices = match.supplierMatches.map((sm) => sm.price);
			const bestPrice = prices.length ? Math.min(...prices) : 0;
			const qty = qtyByProduct.get(match.clientProduct.id) ?? null;
			const mine = match.supplierMatches.find(
				(sm) => sm.supplierCompanyId === supplierCompanyId,
			);

			if (mine) {
				const isBest = bestPrice > 0 && mine.price <= bestPrice;
				if (isBest) bestPriceItems += 1;
				offeredValue += mine.price * (qty ?? 1);
				items.push({
					clientName: match.clientProduct.name,
					sku: match.clientProduct.sku,
					code: match.clientProduct.code,
					quantity: qty,
					supplierName: mine.supplierProduct.name,
					supplierSku: mine.supplierProduct.sku,
					price: mine.price,
					matchType: match.matchType,
					confidence: match.confidence,
					bestPrice,
					isBest,
				});
			} else if (match.supplierMatches.length > 0) {
				gaps.push({
					clientName: match.clientProduct.name,
					sku: match.clientProduct.sku,
					code: match.clientProduct.code,
					quantity: qty,
					bestPriceElsewhere: bestPrice || null,
					otherSuppliers: match.supplierMatches.length,
				});
			}
		}

		const totalItems = full.totalProducts;
		const coveredItems = items.length;

		return {
			resumo: {
				totalItems,
				matchedItems: full.matches.length,
				coveredItems,
				coveragePct:
					totalItems > 0 ? Math.round((coveredItems / totalItems) * 100) : 0,
				offeredValue,
				bestPriceItems,
				gapItems: Math.max(0, totalItems - coveredItems),
			},
			items,
			gaps,
		};
	}

	/**
	 * Optimized product search with caching
	 */
	@cached(
		cache.search,
		(query: string, supplierId?: string, limit?: number) =>
			PriceCompareCache.keys.search(
				query,
				`${supplierId || "all"}:${limit || 20}`,
			),
		2 * 60 * 1000, // 2 minutes cache for searches
	)
	static async searchProducts(
		query: string,
		supplierId?: string,
		limit: number = 20,
		requestId?: string,
	) {
		try {
			if (!query || query.trim().length < 2) {
				throw ErrorFactory.validation.invalidFormat(
					"query",
					query,
					"minimum 2 characters",
					requestId,
				);
			}

			const _normalizedQuery = OptimizedProductMatcher.normalizeString(query);

			const where: Prisma.UploadedProductWhereInput = {
				upload: {
					uploadType: "SUPPLIER_PRODUCTS",
					isActive: true,
					status: "COMPLETED",
					...(supplierId ? { companyId: supplierId } : {}),
				},
				price: { gt: 0 }, // Only products with valid prices
				OR: [
					{ name: { contains: query, mode: "insensitive" } },
					{ sku: { contains: query, mode: "insensitive" } },
					{ code: { contains: query, mode: "insensitive" } },
				],
			};

			const products = await prisma.uploadedProduct.findMany({
				where,
				take: limit,
				include: {
					upload: {
						include: {
							company: {
								select: {
									id: true,
									name: true,
									type: true,
								},
							},
						},
					},
				},
				orderBy: [{ price: "asc" }, { name: "asc" }],
			});

			return products.map((product) => ({
				id: product.id,
				sku: product.sku,
				code: product.code,
				name: product.name,
				price: product.price,
				description: product.description,
				category: product.category,
				unit: product.unit,
				quantity: product.quantity,
				supplier: product.upload.company,
			}));
		} catch (error) {
			if (error instanceof AppError) {
				throw error;
			}

			console.error("Search products error:", error);
			throw ErrorFactory.database.recordNotFound("Products", query, requestId);
		}
	}

	/**
	 * Cache invalidation helpers
	 */
	static invalidateCache(type: "products" | "comparisons" | "all" = "all") {
		switch (type) {
			case "products":
				cache.products.clear();
				cache.search.clear();
				break;
			case "comparisons":
				cache.comparisons.clear();
				break;
			case "all":
				cache.invalidatePattern("*");
				break;
		}
	}

	/**
	 * Get performance metrics
	 */
	static getPerformanceMetrics() {
		return cache.getOverallStats();
	}
}
