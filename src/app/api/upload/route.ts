import { type NextRequest, NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { FileProcessor } from "@/lib/services/file-processor";
import { uploadFileSchema } from "@/lib/validations/upload";

export async function POST(request: NextRequest) {
	try {
		// Verificar autenticação
		const user = await requireAuth(["REPRESENTATIVE", "CLIENT"]);

		// Parse form data
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const uploadType = formData.get("uploadType") as string;

		if (!file) {
			return NextResponse.json({ error: "File is required" }, { status: 400 });
		}

		// Validate upload type + resolve the owning supplier company.
		let validUploadType: "SUPPLIER_PRODUCTS" | "CLIENT_REQUIREMENTS";
		let ownerCompanyId: string;

		if (user.role === "REPRESENTATIVE" && uploadType === "SUPPLIER_PRODUCTS") {
			validUploadType = "SUPPLIER_PRODUCTS";
			// O representante escolhe de qual fornecedor é a lista de preços.
			const supplierCompanyId = formData.get("supplierCompanyId") as
				| string
				| null;
			const ids = await getRepresentedSupplierIds(user);
			if (!supplierCompanyId || !ids.includes(supplierCompanyId)) {
				return NextResponse.json(
					{ error: "Selecione um fornecedor que você representa" },
					{ status: 403 },
				);
			}
			ownerCompanyId = supplierCompanyId;
		} else if (user.role === "CLIENT" && uploadType === "CLIENT_REQUIREMENTS") {
			validUploadType = "CLIENT_REQUIREMENTS";
			if (!user.company) {
				return NextResponse.json(
					{ error: "Usuário deve estar associado a uma empresa" },
					{ status: 400 },
				);
			}
			ownerCompanyId = user.company.id;
		} else {
			return NextResponse.json(
				{ error: "Tipo de upload inválido para seu perfil" },
				{ status: 400 },
			);
		}

		// Validate file
		const validationResult = uploadFileSchema.safeParse({
			file,
			uploadType: validUploadType,
		});

		if (!validationResult.success) {
			return NextResponse.json(
				{
					error: "Arquivo inválido",
					details: validationResult.error.issues,
				},
				{ status: 400 },
			);
		}

		// Process file
		const result = await FileProcessor.processFile(
			file,
			validUploadType,
			ownerCompanyId,
			user.id,
		);

		return NextResponse.json({
			success: true,
			message: "Arquivo processado com sucesso",
			data: result,
		});
	} catch (error) {
		console.error("Upload error:", error);

		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}

		if (
			error instanceof Error &&
			error.message.includes("Failed to process file")
		) {
			return NextResponse.json(
				{
					error:
						"Erro ao processar arquivo. Verifique o formato e tente novamente.",
				},
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// Get upload status
export async function GET(request: NextRequest) {
	try {
		const user = await requireAuth(["REPRESENTATIVE", "CLIENT"]);
		const { searchParams } = new URL(request.url);
		const uploadId = searchParams.get("uploadId");

		if (!uploadId) {
			return NextResponse.json(
				{ error: "Upload ID is required" },
				{ status: 400 },
			);
		}

		// Get upload details
		const upload = await prisma.uploadHistory.findUnique({
			where: { id: uploadId },
			include: {
				products: {
					take: 10, // Preview only
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
			},
		});

		if (!upload) {
			return NextResponse.json(
				{ error: "Upload não encontrado" },
				{ status: 404 },
			);
		}

		// Verify ownership: client owns its company's upload; representative owns
		// uploads of any represented supplier.
		const owns =
			user.role === "REPRESENTATIVE"
				? (await getRepresentedSupplierIds(user)).includes(upload.companyId)
				: upload.companyId === user.company?.id;
		if (!owns) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		return NextResponse.json({
			id: upload.id,
			fileName: upload.fileName,
			status: upload.status,
			uploadType: upload.uploadType,
			totalRows: upload.totalRows,
			processedRows: upload.processedRows,
			errorRows: upload.errorRows,
			priceChangeIndicator: upload.priceChangeIndicator,
			uploadedAt: upload.uploadedAt,
			processedAt: upload.processedAt,
			preview: upload.products.slice(0, 5), // Show first 5 products
		});
	} catch (error) {
		console.error("Get upload error:", error);

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
