import Fuse from "fuse.js";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { normalizeString as normalizeStringUtil } from "./matching-utils";

export interface UploadedProductWithSupplier {
	id: string;
	name: string | null;
	sku: string | null;
	code: string | null;
	price: number | null;
	description: string | null;
	category: string | null;
	unit: string | null;
	supplier: {
		id: string;
		name: string;
	};
	[key: string]: unknown;
}

export interface ClientProductRecord {
	id: string;
	name: string | null;
	sku: string | null;
	code: string | null;
	price: number | null;
	[key: string]: unknown;
}

export interface MatchResult {
	clientProduct: ClientProductRecord;
	supplierMatches: SupplierMatchResult[];
	bestMatch?: SupplierMatchResult;
	bestPrice?: number;
	matchType: "SKU" | "CODE" | "NAME" | "NONE";
	confidence: number;
}

export interface SupplierMatchResult {
	product: UploadedProductWithSupplier;
	supplier: { id: string; name: string };
	matchType: "SKU" | "CODE" | "NAME";
	confidence: number;
	price: number;
}

// biome-ignore lint/complexity/noStaticOnlyClass: intentional static utility namespace
export class ProductMatcher {
	private static readonly NAME_SIMILARITY_THRESHOLD = 0.7;
	private static readonly FUZZY_SEARCH_THRESHOLD = 0.6;

	static async createComparison(
		clientUploadId: string,
		clientId: string,
	): Promise<string> {
		try {
			// Get client products from upload
			const clientUpload = await prisma.uploadHistory.findUnique({
				where: { id: clientUploadId },
				include: { products: true },
			});

			if (!clientUpload || clientUpload.companyId !== clientId) {
				throw new Error("Upload não encontrado ou não autorizado");
			}

			// Get all active supplier products
			const activeSupplierUploads = await prisma.uploadHistory.findMany({
				where: {
					uploadType: "SUPPLIER_PRODUCTS",
					isActive: true,
					status: "COMPLETED",
				},
				include: {
					products: true,
					company: true,
				},
			});

			// Flatten supplier products
			const supplierProducts = activeSupplierUploads.flatMap((upload) =>
				upload.products.map((product) => ({
					...product,
					supplier: upload.company,
				})),
			);

			// Perform matching
			const matches = await ProductMatcher.matchProducts(
				clientUpload.products,
				supplierProducts,
			);

			// Calculate statistics
			const totalProducts = clientUpload.products.length;
			const matchedProducts = matches.filter(
				(m) => m.matchType !== "NONE",
			).length;
			const unmatchedProducts = totalProducts - matchedProducts;
			const bestPriceTotal = matches
				.filter((m) => m.bestPrice)
				// biome-ignore lint/style/noNonNullAssertion: filtered to truthy bestPrice immediately above
				.reduce((sum, m) => sum + m.bestPrice!, 0);

			// Create comparison record
			const comparison = await prisma.comparison.create({
				data: {
					clientUploadId,
					clientId,
					totalProducts,
					matchedProducts,
					unmatchedProducts,
					bestPriceTotal,
				},
			});

			// Save matches to database
			for (const match of matches) {
				if (match.matchType === "NONE") continue;

				const comparisonMatch = await prisma.comparisonMatch.create({
					data: {
						comparisonId: comparison.id,
						clientProductId: match.clientProduct.id,
						productName: match.clientProduct.name ?? "",
						bestPrice: match.bestPrice,
						bestSupplierId: match.bestMatch?.supplier.id,
						matchType: match.matchType,
						confidence: match.confidence,
					},
				});

				// Save supplier matches
				for (const supplierMatch of match.supplierMatches) {
					await prisma.supplierMatch.create({
						data: {
							comparisonMatchId: comparisonMatch.id,
							supplierProductId: supplierMatch.product.id,
							price: supplierMatch.price,
							supplierCompanyId: supplierMatch.supplier.id,
						},
					});
				}
			}

			return comparison.id;
		} catch (error) {
			console.error("Create comparison error:", error);
			throw new Error("Erro ao criar comparação");
		}
	}

	private static async matchProducts(
		clientProducts: ClientProductRecord[],
		supplierProducts: UploadedProductWithSupplier[],
	): Promise<MatchResult[]> {
		const results: MatchResult[] = [];

		// Create Fuse.js index for fuzzy name searching
		const fuse = new Fuse(supplierProducts, {
			keys: ["name"],
			threshold: ProductMatcher.FUZZY_SEARCH_THRESHOLD,
			includeScore: true,
		});

		for (const clientProduct of clientProducts) {
			const matchResult = await ProductMatcher.findMatches(
				clientProduct,
				supplierProducts,
				fuse,
			);
			results.push(matchResult);
		}

		return results;
	}

	private static async findMatches(
		clientProduct: ClientProductRecord,
		supplierProducts: UploadedProductWithSupplier[],
		fuse: Fuse<UploadedProductWithSupplier>,
	): Promise<MatchResult> {
		const supplierMatches: SupplierMatchResult[] = [];

		// 1. Exact SKU matching (highest priority)
		if (clientProduct.sku) {
			for (const supplierProduct of supplierProducts) {
				if (
					supplierProduct.sku &&
					ProductMatcher.normalizeString(clientProduct.sku) ===
						ProductMatcher.normalizeString(supplierProduct.sku)
				) {
					supplierMatches.push({
						product: supplierProduct,
						supplier: supplierProduct.supplier,
						matchType: "SKU",
						confidence: 1.0,
						price: supplierProduct.price || 0,
					});
				}
			}
		}

		// 2. Exact CODE matching (second priority)
		if (supplierMatches.length === 0 && clientProduct.code) {
			for (const supplierProduct of supplierProducts) {
				if (
					supplierProduct.code &&
					ProductMatcher.normalizeString(clientProduct.code) ===
						ProductMatcher.normalizeString(supplierProduct.code)
				) {
					supplierMatches.push({
						product: supplierProduct,
						supplier: supplierProduct.supplier,
						matchType: "CODE",
						confidence: 1.0,
						price: supplierProduct.price || 0,
					});
				}
			}
		}

		// 3. Name matching (exact and fuzzy)
		if (supplierMatches.length === 0 && clientProduct.name) {
			// Exact name match first
			for (const supplierProduct of supplierProducts) {
				if (
					supplierProduct.name &&
					ProductMatcher.normalizeString(clientProduct.name) ===
						ProductMatcher.normalizeString(supplierProduct.name)
				) {
					supplierMatches.push({
						product: supplierProduct,
						supplier: supplierProduct.supplier,
						matchType: "NAME",
						confidence: 1.0,
						price: supplierProduct.price || 0,
					});
				}
			}

			// Fuzzy name matching if no exact match
			if (supplierMatches.length === 0) {
				const fuzzyResults = fuse.search(clientProduct.name);

				for (const result of fuzzyResults) {
					if (
						result.score &&
						1 - result.score >= ProductMatcher.NAME_SIMILARITY_THRESHOLD
					) {
						// Use custom similarity calculation
						const itemName = result.item.name ?? "";
						const similarity = ProductMatcher.calculateSimilarity(
							ProductMatcher.normalizeString(clientProduct.name ?? ""),
							ProductMatcher.normalizeString(itemName),
						);

						if (similarity >= ProductMatcher.NAME_SIMILARITY_THRESHOLD) {
							supplierMatches.push({
								product: result.item,
								supplier: result.item.supplier,
								matchType: "NAME",
								confidence: Math.max(1 - result.score, similarity),
								price: result.item.price || 0,
							});
						}
					}
				}
			}
		}

		// Find best match and price
		const bestMatch =
			supplierMatches.length > 0
				? supplierMatches.reduce((best, current) =>
						current.confidence > best.confidence ? current : best,
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
		};
	}

	private static normalizeString(str: string): string {
		return normalizeStringUtil(str);
	}

	private static calculateSimilarity(str1: string, str2: string): number {
		// Simple Jaccard similarity implementation
		const set1 = new Set(str1.split(" "));
		const set2 = new Set(str2.split(" "));

		const intersection = new Set([...set1].filter((x) => set2.has(x)));
		const union = new Set([...set1, ...set2]);

		return intersection.size / union.size;
	}

	static async getComparison(comparisonId: string, clientId: string) {
		try {
			const comparison = await prisma.comparison.findUnique({
				where: { id: comparisonId },
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

			if (!comparison || comparison.clientId !== clientId) {
				throw new Error("Comparação não encontrada ou não autorizada");
			}

			return comparison;
		} catch (error) {
			console.error("Get comparison error:", error);
			throw new Error("Erro ao buscar comparação");
		}
	}

	static async searchProducts(
		query: string,
		supplierId?: string,
		limit: number = 20,
	) {
		try {
			const where: Prisma.UploadedProductWhereInput = {
				upload: {
					uploadType: "SUPPLIER_PRODUCTS",
					isActive: true,
					status: "COMPLETED",
					...(supplierId ? { companyId: supplierId } : {}),
				},
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
							company: true,
						},
					},
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
				supplier: product.upload.company,
			}));
		} catch (error) {
			console.error("Search products error:", error);
			throw new Error("Erro ao buscar produtos");
		}
	}
}
