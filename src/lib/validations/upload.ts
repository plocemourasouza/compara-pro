import { z } from "zod";

// File upload validation
export const uploadFileSchema = z.object({
	file: z
		.any()
		.refine((file) => file instanceof File, "File is required")
		.refine(
			(file) => file.size <= 10 * 1024 * 1024, // 10MB
			"File size must be less than 10MB",
		)
		.refine(
			(file) =>
				[
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
					"application/vnd.ms-excel", // .xls
					"text/csv", // .csv
				].includes(file.type),
			"File must be Excel (.xlsx, .xls) or CSV (.csv)",
		),
	uploadType: z.enum(["SUPPLIER_PRODUCTS", "CLIENT_REQUIREMENTS"]),
});

// Product data validation for suppliers.
// Optional string fields use .nullish() because empty spreadsheet cells / unmapped
// columns arrive as null (or undefined) — .optional() alone would reject null.
export const supplierProductSchema = z.object({
	sku: z.string().nullish(),
	code: z.string().nullish(),
	name: z.string().min(1, "Product name is required"),
	price: z.number().positive("Price must be positive").optional(),
	description: z.string().nullish(),
	category: z.string().nullish(),
	unit: z.string().nullish(),
});

// Product data validation for clients (requirements)
export const clientRequirementSchema = z.object({
	sku: z.string().nullish(),
	code: z.string().nullish(),
	name: z.string().min(1, "Product name is required"),
	description: z.string().nullish(),
	category: z.string().nullish(),
	unit: z.string().nullish(),
	targetPrice: z.number().positive().optional(),
	quantity: z.number().positive().optional(),
});

// Upload processing result
export const uploadResultSchema = z.object({
	uploadId: z.string(),
	fileName: z.string(),
	fileSize: z.number(),
	uploadType: z.enum(["SUPPLIER_PRODUCTS", "CLIENT_REQUIREMENTS"]),
	status: z.enum(["PROCESSING", "COMPLETED", "FAILED"]),
	totalRows: z.number(),
	processedRows: z.number(),
	errorRows: z.number(),
	errors: z
		.array(
			z.object({
				row: z.number(),
				field: z.string().optional(),
				message: z.string(),
			}),
		)
		.optional(),
	priceChangeIndicator: z
		.enum(["UP", "DOWN", "SAME", "FIRST_UPLOAD"])
		.optional(),
});

// Column mapping for Excel/CSV processing
export const columnMappingSchema = z.object({
	sku: z.string().optional(),
	code: z.string().optional(),
	name: z.string(),
	price: z.string().optional(),
	description: z.string().optional(),
	category: z.string().optional(),
	unit: z.string().optional(),
	targetPrice: z.string().optional(), // For client requirements
	quantity: z.string().optional(), // For client requirements
});

export type UploadFileData = z.infer<typeof uploadFileSchema>;
export type SupplierProduct = z.infer<typeof supplierProductSchema>;
export type ClientRequirement = z.infer<typeof clientRequirementSchema>;
export type UploadResult = z.infer<typeof uploadResultSchema>;
export type ColumnMapping = z.infer<typeof columnMappingSchema>;
