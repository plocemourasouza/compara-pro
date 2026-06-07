"use client";

import {
	CheckCircle,
	Download,
	FileSpreadsheet,
	Minus,
	TrendingDown,
	TrendingUp,
	Upload,
	XCircle,
} from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
};

interface UploadResult {
	uploadId: string;
	totalRows: number;
	processedRows: number;
	errorRows: number;
	errors?: Array<{ row: number; message: string }>;
	priceChangeIndicator?: "UP" | "DOWN" | "SAME" | "FIRST_UPLOAD";
}

interface UploadClientProps {
	user: User;
}

export default function UploadClient({ user }: UploadClientProps) {
	const [uploading, setUploading] = useState(false);
	const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [progress, setProgress] = useState(0);

	const uploadType =
		user.role === "REPRESENTATIVE"
			? "SUPPLIER_PRODUCTS"
			: "CLIENT_REQUIREMENTS";
	const uploadLabel =
		user.role === "REPRESENTATIVE"
			? "Lista de Produtos"
			: "Lista de Requisições";

	const onDrop = async (acceptedFiles: File[]) => {
		const file = acceptedFiles[0];
		if (!file) return;

		setUploading(true);
		setError(null);
		setUploadResult(null);
		setProgress(0);

		try {
			// Simulate progress
			const progressInterval = setInterval(() => {
				setProgress((prev) => Math.min(prev + 10, 90));
			}, 200);

			const formData = new FormData();
			formData.append("file", file);
			formData.append("uploadType", uploadType);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			clearInterval(progressInterval);
			setProgress(100);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro no upload");
			}

			const result = await response.json();
			setUploadResult(result.data);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		} finally {
			setUploading(false);
		}
	};

	const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
		useDropzone({
			onDrop,
			accept: {
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
					".xlsx",
				],
				"application/vnd.ms-excel": [".xls"],
				"text/csv": [".csv"],
			},
			multiple: false,
			disabled: uploading,
		});

	const getPriceChangeIcon = (indicator?: string) => {
		switch (indicator) {
			case "UP":
				return <TrendingUp className="h-4 w-4 text-destructive" />;
			case "DOWN":
				return <TrendingDown className="h-4 w-4 text-success" />;
			case "SAME":
				return <Minus className="h-4 w-4 text-yellow-500" />;
			default:
				return null;
		}
	};

	const getPriceChangeLabel = (indicator?: string) => {
		switch (indicator) {
			case "UP":
				return "Preços aumentaram";
			case "DOWN":
				return "Preços diminuíram";
			case "SAME":
				return "Preços mantidos";
			case "FIRST_UPLOAD":
				return "Primeiro upload";
			default:
				return "";
		}
	};

	const downloadTemplate = () => {
		// Create sample data based on user role
		const sampleData =
			user.role === "REPRESENTATIVE"
				? [
						{
							SKU: "PROD001",
							Código: "ABC123",
							Nome: "Produto Exemplo",
							Preço: "10.50",
							Descrição: "Descrição do produto",
							Categoria: "Categoria A",
							Unidade: "UN",
						},
					]
				: [
						{
							SKU: "PROD001",
							Código: "ABC123",
							Nome: "Produto Necessário",
							Descrição: "Descrição da necessidade",
							Categoria: "Categoria A",
							Unidade: "UN",
							"Preço Alvo": "10.00",
							Quantidade: "100",
						},
					];

		// Convert to CSV
		const headers = Object.keys(sampleData[0] ?? {});
		const csvContent = [
			headers.join(","),
			...sampleData.map((row) => Object.values(row).join(",")),
		].join("\\n");

		// Download
		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `template_${uploadType.toLowerCase()}.csv`;
		a.click();
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Upload de Arquivo</h1>
				<p className="text-muted-foreground">
					Faça upload da sua {uploadLabel.toLowerCase()}
				</p>
			</div>

			{/* Template Download */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Download className="h-5 w-5" />
						Template
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground mb-4">
						Baixe o template para garantir que seu arquivo está no formato
						correto.
					</p>
					<Button variant="outline" onClick={downloadTemplate}>
						<Download className="h-4 w-4 mr-2" />
						Baixar Template
					</Button>
				</CardContent>
			</Card>

			{/* Upload Area */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Upload className="h-5 w-5" />
						{uploadLabel}
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div
						{...getRootProps()}
						className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? "border-primary bg-primary/10" : "border-border"}
              ${uploading ? "opacity-50 cursor-not-allowed" : "hover:border-primary hover:bg-primary/10"}
            `}
					>
						<input {...getInputProps()} />
						<FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />

						{isDragActive ? (
							<p className="text-primary">Solte o arquivo aqui...</p>
						) : (
							<div>
								<p className="text-muted-foreground mb-2">
									Arraste um arquivo aqui ou clique para selecionar
								</p>
								<p className="text-sm text-muted-foreground">
									Formatos suportados: .xlsx, .xls, .csv (máx. 10MB)
								</p>
							</div>
						)}

						{acceptedFiles.length > 0 && (
							<div className="mt-4 p-2 bg-muted rounded">
								<p className="text-sm font-medium">{acceptedFiles[0]?.name}</p>
								<p className="text-xs text-muted-foreground">
									{((acceptedFiles[0]?.size ?? 0) / 1024 / 1024).toFixed(2)} MB
								</p>
							</div>
						)}
					</div>

					{uploading && (
						<div className="mt-4 space-y-2">
							<div className="flex justify-between text-sm">
								<span>Processando arquivo...</span>
								<span>{progress}%</span>
							</div>
							<Progress value={progress} />
						</div>
					)}
				</CardContent>
			</Card>

			{/* Error Display */}
			{error && (
				<Alert variant="destructive">
					<XCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Success Result */}
			{uploadResult && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<CheckCircle className="h-5 w-5 text-success" />
							Upload Concluído
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="text-center p-4 bg-success/10 rounded-lg">
								<div className="text-2xl font-bold text-success">
									{uploadResult.processedRows}
								</div>
								<div className="text-sm text-success">Processados</div>
							</div>

							<div className="text-center p-4 bg-primary/10 rounded-lg">
								<div className="text-2xl font-bold text-primary">
									{uploadResult.totalRows}
								</div>
								<div className="text-sm text-primary">Total</div>
							</div>

							{uploadResult.errorRows > 0 && (
								<div className="text-center p-4 bg-destructive/10 rounded-lg">
									<div className="text-2xl font-bold text-destructive">
										{uploadResult.errorRows}
									</div>
									<div className="text-sm text-destructive">Erros</div>
								</div>
							)}
						</div>

						{uploadResult.priceChangeIndicator &&
							user.role === "REPRESENTATIVE" && (
								<div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
									{getPriceChangeIcon(uploadResult.priceChangeIndicator)}
									<span className="text-sm font-medium">
										{getPriceChangeLabel(uploadResult.priceChangeIndicator)}
									</span>
								</div>
							)}

						{uploadResult.errors && uploadResult.errors.length > 0 && (
							<div>
								<h4 className="font-medium mb-2 text-destructive">
									Erros Encontrados:
								</h4>
								<div className="max-h-40 overflow-y-auto space-y-1">
									{uploadResult.errors.slice(0, 10).map((error) => (
										<div
											key={error.row}
											className="text-sm text-destructive p-2 bg-destructive/10 rounded"
										>
											Linha {error.row}: {error.message}
										</div>
									))}
									{uploadResult.errors.length > 10 && (
										<div className="text-sm text-muted-foreground p-2">
											... e mais {uploadResult.errors.length - 10} erros
										</div>
									)}
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	);
}
