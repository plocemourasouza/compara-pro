"use client";

import { AlertCircle, CheckCircle, FileText, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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

interface SupplierUploadClientProps {
	user: User;
	suppliers: { id: string; name: string }[];
}

export default function SupplierUploadClient({
	user: _user,
	suppliers,
}: SupplierUploadClientProps) {
	const router = useRouter();
	const [supplierCompanyId, setSupplierCompanyId] = useState<string>(
		suppliers.length === 1 ? (suppliers[0]?.id ?? "") : "",
	);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadResult, setUploadResult] = useState<{
		success: boolean;
		message: string;
		uploadId?: string;
	} | null>(null);

	const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// Validate file type
			const allowedTypes = [
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"application/vnd.ms-excel",
				"text/csv",
			];

			if (!allowedTypes.includes(file.type)) {
				alert(
					"Tipo de arquivo não suportado. Use arquivos Excel (.xlsx, .xls) ou CSV.",
				);
				return;
			}

			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				alert("Arquivo muito grande. O tamanho máximo é 10MB.");
				return;
			}

			setSelectedFile(file);
			setUploadResult(null);
		}
	};

	const handleUpload = async () => {
		if (!selectedFile || !supplierCompanyId) return;

		setUploading(true);
		setUploadProgress(0);

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("uploadType", "SUPPLIER_PRODUCTS");
			formData.append("supplierCompanyId", supplierCompanyId);

			// Simulate progress
			const progressInterval = setInterval(() => {
				setUploadProgress((prev) => {
					if (prev >= 90) {
						clearInterval(progressInterval);
						return prev;
					}
					return prev + 10;
				});
			}, 200);

			const response = await fetch("/api/upload", {
				method: "POST",
				body: formData,
			});

			clearInterval(progressInterval);
			setUploadProgress(100);

			const result = await response.json();

			if (response.ok) {
				setUploadResult({
					success: true,
					message: `Upload realizado com sucesso! ${result.processedCount} produtos processados.`,
					uploadId: result.uploadId,
				});
				setSelectedFile(null);
				// Reset file input
				const fileInput = document.getElementById(
					"file-input",
				) as HTMLInputElement;
				if (fileInput) fileInput.value = "";
			} else {
				setUploadResult({
					success: false,
					message: result.error || "Erro ao processar arquivo",
				});
			}
		} catch (error) {
			console.error("Upload error:", error);
			setUploadResult({
				success: false,
				message: "Erro ao fazer upload do arquivo",
			});
		} finally {
			setUploading(false);
			setTimeout(() => setUploadProgress(0), 2000);
		}
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Upload de Lista de Preços
				</h1>
				<p className="text-muted-foreground">
					Envie sua lista de produtos e preços em formato Excel ou CSV
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Upload className="h-5 w-5" />
						Enviar Arquivo
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="supplier-select">Fornecedor de origem</Label>
						<Select
							value={supplierCompanyId}
							onValueChange={setSupplierCompanyId}
							disabled={uploading}
						>
							<SelectTrigger id="supplier-select" className="mt-2">
								<SelectValue placeholder="Selecione o fornecedor desta lista" />
							</SelectTrigger>
							<SelectContent>
								{suppliers.map((s) => (
									<SelectItem key={s.id} value={s.id}>
										{s.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{suppliers.length === 0 && (
							<p className="text-sm text-destructive mt-1">
								Você ainda não representa nenhum fornecedor. Cadastre um em
								Fornecedores Representados.
							</p>
						)}
					</div>

					<div>
						<Label htmlFor="file-input">
							Selecione um arquivo Excel (.xlsx, .xls) ou CSV
						</Label>
						<Input
							id="file-input"
							type="file"
							accept=".xlsx,.xls,.csv"
							onChange={handleFileSelect}
							disabled={uploading}
							className="mt-2"
						/>
						<p className="text-sm text-muted-foreground mt-1">
							Tamanho máximo: 10MB
						</p>
					</div>

					{selectedFile && (
						<div className="p-4 bg-muted rounded-lg">
							<div className="flex items-center gap-3">
								<FileText className="h-8 w-8 text-primary" />
								<div className="flex-1">
									<p className="font-medium">{selectedFile.name}</p>
									<p className="text-sm text-muted-foreground">
										{formatFileSize(selectedFile.size)}
									</p>
								</div>
							</div>
						</div>
					)}

					{uploading && (
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>Processando arquivo...</span>
								<span>{uploadProgress}%</span>
							</div>
							<Progress value={uploadProgress} />
						</div>
					)}

					{uploadResult && (
						<div
							className={`p-4 rounded-lg flex items-start gap-3 ${
								uploadResult.success
									? "bg-success/10 text-success"
									: "bg-destructive/10 text-destructive"
							}`}
						>
							{uploadResult.success ? (
								<CheckCircle className="h-5 w-5 mt-0.5 text-success" />
							) : (
								<AlertCircle className="h-5 w-5 mt-0.5 text-destructive" />
							)}
							<div>
								<p className="font-medium">
									{uploadResult.success ? "Upload Concluído" : "Erro no Upload"}
								</p>
								<p className="text-sm mt-1">{uploadResult.message}</p>
							</div>
						</div>
					)}

					<div className="flex gap-3">
						<Button
							onClick={handleUpload}
							disabled={!selectedFile || !supplierCompanyId || uploading}
							className="flex-1"
						>
							{uploading ? "Processando..." : "Fazer Upload"}
						</Button>
						<Button variant="outline" onClick={() => router.push("/dashboard")}>
							Voltar
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Formato do Arquivo</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground mb-3">
						Seu arquivo deve conter as seguintes colunas:
					</p>
					<div className="bg-muted p-4 rounded-lg">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
							<div>
								<strong>SKU ou Código:</strong> Código único do produto
							</div>
							<div>
								<strong>Nome:</strong> Nome/descrição do produto
							</div>
							<div>
								<strong>Preço:</strong> Preço unitário (ex: 10.50)
							</div>
							<div>
								<strong>Categoria:</strong> Categoria do produto (opcional)
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
