import * as XLSX from "xlsx";
import { prisma } from "@/lib/db";
import {
	type ClientRequirement,
	clientRequirementSchema,
	type SupplierProduct,
	supplierProductSchema,
} from "@/lib/validations/upload";
import {
	calculateAveragePrice as calculateAveragePriceUtil,
	parseNumber as parseNumberUtil,
	priceChangeDirection,
} from "./parsing-utils";

export interface ProcessingError {
	row: number;
	field?: string;
	message: string;
}

export interface ProcessingResult {
	uploadId: string;
	totalRows: number;
	processedRows: number;
	errorRows: number;
	errors: ProcessingError[];
	priceChangeIndicator?: "UP" | "DOWN" | "SAME" | "FIRST_UPLOAD";
}

// biome-ignore lint/complexity/noStaticOnlyClass: intentional static utility namespace
export class FileProcessor {
	static async processFile(
		file: File,
		uploadType: "SUPPLIER_PRODUCTS" | "CLIENT_REQUIREMENTS",
		companyId: string,
		_userId: string,
	): Promise<ProcessingResult> {
		try {
			// Create upload history record
			const uploadHistory = await prisma.uploadHistory.create({
				data: {
					companyId,
					fileName: file.name,
					fileSize: file.size,
					uploadType,
					status: "PROCESSING",
					totalRows: 0,
					processedRows: 0,
					errorRows: 0,
				},
			});

			// Parse file
			const data = await FileProcessor.parseFile(file);
			const totalRows = data.length;

			// Update total rows
			await prisma.uploadHistory.update({
				where: { id: uploadHistory.id },
				data: { totalRows },
			});

			// Process data
			const result = await FileProcessor.processData(
				data,
				uploadHistory.id,
				uploadType,
				companyId,
			);

			// Calculate price change indicator
			const priceChangeIndicator = await FileProcessor.calculatePriceChange(
				companyId,
				uploadType,
				result.processedProducts,
			);

			// Deactivate previous uploads for suppliers
			if (uploadType === "SUPPLIER_PRODUCTS") {
				await prisma.uploadHistory.updateMany({
					where: {
						companyId,
						uploadType: "SUPPLIER_PRODUCTS",
						id: { not: uploadHistory.id },
					},
					data: { isActive: false },
				});
			}

			// Update upload history with final results
			await prisma.uploadHistory.update({
				where: { id: uploadHistory.id },
				data: {
					status: result.errors.length === totalRows ? "FAILED" : "COMPLETED",
					processedRows: result.processedRows,
					errorRows: result.errorRows,
					processedAt: new Date(),
					isActive: uploadType === "SUPPLIER_PRODUCTS",
					priceChangeIndicator,
				},
			});

			return {
				uploadId: uploadHistory.id,
				totalRows,
				processedRows: result.processedRows,
				errorRows: result.errorRows,
				errors: result.errors,
				priceChangeIndicator,
			};
		} catch (error) {
			console.error("File processing error:", error);
			throw new Error("Failed to process file");
		}
	}

	private static async parseFile(
		file: File,
	): Promise<Record<string, unknown>[]> {
		const buffer = await file.arrayBuffer();

		try {
			const workbook =
				file.type === "text/csv"
					? XLSX.read(new TextDecoder().decode(buffer), { type: "string" })
					: XLSX.read(buffer, { type: "array" });

			const sheetName = workbook.SheetNames[0];
			const worksheet = sheetName ? workbook.Sheets[sheetName] : undefined;
			if (!worksheet) {
				throw new Error("Invalid file format or corrupted file");
			}

			return XLSX.utils.sheet_to_json(worksheet, { defval: "" });
		} catch (_error) {
			throw new Error("Invalid file format or corrupted file");
		}
	}

	private static async processData(
		data: Record<string, unknown>[],
		uploadId: string,
		uploadType: "SUPPLIER_PRODUCTS" | "CLIENT_REQUIREMENTS",
		_companyId: string,
	) {
		const errors: ProcessingError[] = [];
		const processedProducts: (SupplierProduct | ClientRequirement)[] = [];
		let processedRows = 0;
		let errorRows = 0;

		for (let i = 0; i < data.length; i++) {
			const row = data[i];
			if (!row) continue;
			const rowNumber = i + 2; // Excel rows start at 1, plus header

			try {
				// Normalize column names (remove spaces, convert to lowercase)
				const normalizedRow = FileProcessor.normalizeRow(row);

				// Validate and process based on upload type
				let validatedData: SupplierProduct | ClientRequirement;

				if (uploadType === "SUPPLIER_PRODUCTS") {
					validatedData = supplierProductSchema.parse({
						sku: normalizedRow.sku || null,
						code: normalizedRow.code || null,
						name: normalizedRow.name,
						price: FileProcessor.parseNumber(normalizedRow.price),
						description: normalizedRow.description || null,
						category: normalizedRow.category || null,
						unit: normalizedRow.unit || null,
					});
				} else {
					validatedData = clientRequirementSchema.parse({
						sku: normalizedRow.sku || null,
						code: normalizedRow.code || null,
						name: normalizedRow.name,
						description: normalizedRow.description || null,
						category: normalizedRow.category || null,
						unit: normalizedRow.unit || null,
						targetPrice: FileProcessor.parseNumber(
							normalizedRow.targetprice || normalizedRow.targetPrice,
						),
						quantity: FileProcessor.parseNumber(normalizedRow.quantity),
					});
				}

				// Save to database
				await prisma.uploadedProduct.create({
					data: {
						uploadId,
						originalRow: rowNumber,
						...validatedData,
					},
				});

				processedProducts.push(validatedData);
				processedRows++;
			} catch (error) {
				errorRows++;
				if (error instanceof Error) {
					errors.push({
						row: rowNumber,
						message: error.message,
					});
				} else {
					errors.push({
						row: rowNumber,
						message: "Unknown validation error",
					});
				}
			}
		}

		return {
			processedRows,
			errorRows,
			errors,
			processedProducts,
		};
	}

	private static normalizeRow(
		row: Record<string, unknown>,
	): Record<string, unknown> {
		const normalized: Record<string, unknown> = {};

		for (const [key, value] of Object.entries(row)) {
			const normalizedKey = key
				.toLowerCase()
				.replace(/\s+/g, "")
				.replace(/[^a-z0-9]/g, "");

			normalized[normalizedKey] =
				typeof value === "string" ? value.trim() : value;
		}

		return normalized;
	}

	private static parseNumber(value: unknown): number | undefined {
		return parseNumberUtil(value);
	}

	private static async calculatePriceChange(
		companyId: string,
		uploadType: "SUPPLIER_PRODUCTS" | "CLIENT_REQUIREMENTS",
		currentProducts: { price?: number | null; targetPrice?: number | null }[],
	): Promise<"UP" | "DOWN" | "SAME" | "FIRST_UPLOAD"> {
		// Get previous upload for this company
		const previousUpload = await prisma.uploadHistory.findFirst({
			where: {
				companyId,
				uploadType,
				status: "COMPLETED",
			},
			orderBy: { uploadedAt: "desc" },
			skip: 1, // Skip current upload
			include: {
				products: true,
			},
		});

		if (!previousUpload) {
			return "FIRST_UPLOAD";
		}

		// Calculate average prices
		const currentAvg = FileProcessor.calculateAveragePrice(currentProducts);
		const previousAvg = FileProcessor.calculateAveragePrice(
			previousUpload.products,
		);

		if (currentAvg === null || previousAvg === null) {
			return "SAME";
		}

		return priceChangeDirection(currentAvg, previousAvg);
	}

	private static calculateAveragePrice(
		products: { price?: number | null; targetPrice?: number | null }[],
	): number | null {
		return calculateAveragePriceUtil(products);
	}
}
