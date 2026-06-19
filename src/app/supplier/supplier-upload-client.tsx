"use client";

import {
	AlertCircle,
	CheckCircle,
	Download,
	FileText,
	Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { ImportPreview } from "@/components/shared/import-preview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { HeaderMapping } from "@/lib/file-mapping";
import { autoMapHeaders, buildRows, SUPPLIER_FIELDS } from "@/lib/file-mapping";
import { cn } from "@/lib/utils";

type User = {
	id: string;
	name: string;
	email: string;
	area: string;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
};

interface SupplierUploadClientProps {
	user: User;
	suppliers: { id: string; name: string }[];
	onSuccess?: () => void;
	onClose?: () => void;
	/** Reports the current modal step so a parent (dialog) can adjust width. */
	onStageChange?: (stage: "upload" | "mapping") => void;
}

export default function SupplierUploadClient({
	user: _user,
	suppliers,
	onSuccess,
	onClose,
	onStageChange,
}: SupplierUploadClientProps) {
	const router = useRouter();

	const [supplierCompanyId, setSupplierCompanyId] = useState<string>(
		suppliers.length === 1 ? (suppliers[0]?.id ?? "") : "",
	);

	// File + parsed state
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
	const [fileHeaders, setFileHeaders] = useState<string[]>([]);
	const [mapping, setMapping] = useState<HeaderMapping>({});
	const [parseError, setParseError] = useState<string | null>(null);
	const [parsing, setParsing] = useState(false);

	// Upload state
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadResult, setUploadResult] = useState<{
		success: boolean;
		message: string;
		uploadId?: string;
	} | null>(null);

	// ---------------------------------------------------------------------------
	// Parse file in the browser
	// ---------------------------------------------------------------------------
	const parseFile = useCallback(async (file: File) => {
		setParseError(null);
		setParsedRows([]);
		setFileHeaders([]);
		setMapping({});
		setParsing(true);

		try {
			// Yield once so the "lendo arquivo" state paints before the
			// synchronous XLSX work briefly blocks the main thread.
			await new Promise((resolve) => setTimeout(resolve, 0));
			const buf = await file.arrayBuffer();
			const wb = XLSX.read(buf, { type: "array" });
			const firstSheetName = wb.SheetNames[0];
			const ws =
				firstSheetName !== undefined ? wb.Sheets[firstSheetName] : undefined;
			if (!ws) {
				setParseError("Arquivo vazio ou sem planilhas.");
				return;
			}
			const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
				header: 1,
				defval: "",
			});
			// Auto-detect the header row (skips leading title/blank rows).
			const { headers, rows } = buildRows(aoa);
			if (rows.length === 0) {
				setParseError("O arquivo não contém linhas de dados.");
				return;
			}
			setParsedRows(rows);
			setFileHeaders(headers);
			setMapping(autoMapHeaders(headers));
		} catch {
			setParseError(
				"Não foi possível ler o arquivo. Verifique se é um Excel ou CSV válido.",
			);
		} finally {
			setParsing(false);
		}
	}, []);

	// ---------------------------------------------------------------------------
	// Dropzone
	// ---------------------------------------------------------------------------
	const onDrop = useCallback(
		(accepted: File[]) => {
			const file = accepted[0];
			if (!file) return;
			setSelectedFile(file);
			setUploadResult(null);
			void parseFile(file);
		},
		[parseFile],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
				".xlsx",
			],
			"application/vnd.ms-excel": [".xls"],
			"text/csv": [".csv"],
		},
		multiple: false,
		disabled: uploading || !supplierCompanyId,
		maxSize: 10 * 1024 * 1024,
		onDropRejected: (rejections) => {
			const reason = rejections[0]?.errors[0];
			if (reason?.code === "file-too-large") {
				setParseError("Arquivo muito grande. O tamanho máximo é 10MB.");
			} else {
				setParseError(
					"Tipo de arquivo não suportado. Use arquivos Excel (.xlsx, .xls) ou CSV.",
				);
			}
		},
	});

	// ---------------------------------------------------------------------------
	// Mapping editor change
	// ---------------------------------------------------------------------------
	const handleMappingChange = (
		fieldKey: keyof HeaderMapping,
		value: string,
	) => {
		setMapping((prev) => {
			const next = { ...prev };
			if (value === "__ignore__") {
				delete next[fieldKey];
			} else {
				next[fieldKey] = value;
			}
			return next;
		});
	};

	// ---------------------------------------------------------------------------
	// Download template
	// ---------------------------------------------------------------------------
	const downloadTemplate = () => {
		const sampleData = [
			{
				SKU: "PROD001",
				Código: "ABC123",
				Nome: "Produto Exemplo",
				Preço: "10.50",
				Descrição: "Descrição do produto",
				Categoria: "Categoria A",
				Unidade: "UN",
			},
		];

		const headers = Object.keys(sampleData[0] ?? {});
		const csvContent = [
			headers.join(","),
			...sampleData.map((row) =>
				Object.values(row)
					.map((v) => `"${String(v).replace(/"/g, '""')}"`)
					.join(","),
			),
		].join("\n");

		const blob = new Blob([csvContent], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "modelo_produtos.csv";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

	// ---------------------------------------------------------------------------
	// Upload
	// ---------------------------------------------------------------------------
	const handleUpload = async () => {
		if (!selectedFile || !supplierCompanyId || !mapping.name) return;

		setUploading(true);
		setUploadProgress(0);

		try {
			const formData = new FormData();
			formData.append("file", selectedFile);
			formData.append("uploadType", "SUPPLIER_PRODUCTS");
			formData.append("supplierCompanyId", supplierCompanyId);
			formData.append("columnMapping", JSON.stringify(mapping));

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
					message: `Upload realizado com sucesso! ${result.data?.processedRows ?? 0} produtos processados.`,
					uploadId: result.data?.uploadId,
				});
				setSelectedFile(null);
				setParsedRows([]);
				setFileHeaders([]);
				setMapping({});
				onSuccess?.();
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

	const nameIsMapped = Boolean(mapping.name);
	const canUpload =
		Boolean(selectedFile) &&
		Boolean(supplierCompanyId) &&
		nameIsMapped &&
		!uploading &&
		!parsing;

	// Etapa 2 (mapeamento) começa quando há linhas lidas do arquivo.
	const hasData = parsedRows.length > 0;
	// Etapa final: upload concluído com sucesso.
	const done = uploadResult?.success === true;

	// Avisa o pai (dialog) da etapa atual para ajustar a largura do modal.
	useEffect(() => {
		onStageChange?.(hasData ? "mapping" : "upload");
	}, [hasData, onStageChange]);

	const handleBack = () => {
		if (hasData) {
			// Volta para a etapa de upload limpando o arquivo carregado.
			setSelectedFile(null);
			setParsedRows([]);
			setFileHeaders([]);
			setMapping({});
			setParseError(null);
			setUploadResult(null);
			return;
		}
		if (onClose) {
			onClose();
		} else {
			router.push("/dashboard");
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<p className="text-muted-foreground">
					Envie sua lista de produtos e preços em formato Excel ou CSV
				</p>
			</div>

			<Card>
				<CardContent className="space-y-4">
					{!hasData && (
						<>
							{/* Supplier select */}
							<div>
								<Label htmlFor="supplier-select">Fornecedor</Label>
								<Select
									value={supplierCompanyId}
									onValueChange={setSupplierCompanyId}
									disabled={uploading || done}
								>
									<SelectTrigger id="supplier-select" className="mt-2 w-full">
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

							{/* Dropzone */}
							{!done && (
								<div>
									<div
										{...getRootProps()}
										aria-describedby="dropzone-hint"
										className={cn(
											"mt-2 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-12 text-center transition-colors cursor-pointer",
											isDragActive
												? "border-primary bg-primary/5 text-primary"
												: "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/40",
											(uploading || !supplierCompanyId) &&
												"pointer-events-none opacity-50",
										)}
									>
										<input {...getInputProps()} />
										<Upload className="h-8 w-8 text-muted-foreground" />
										{isDragActive ? (
											<p className="text-sm font-medium">
												Solte o arquivo aqui
											</p>
										) : (
											<>
												<p className="text-sm font-medium">
													{supplierCompanyId
														? "Arraste um arquivo ou clique para selecionar"
														: "Selecione o fornecedor primeiro"}
												</p>
												<p
													id="dropzone-hint"
													className="text-xs text-muted-foreground"
												>
													Excel (.xlsx, .xls) ou CSV — máximo 10MB
												</p>
											</>
										)}
									</div>
								</div>
							)}
						</>
					)}

					{/* Selected file info */}
					{selectedFile && !parseError && (
						<div className="flex items-center gap-3 rounded-lg bg-muted p-3">
							<FileText className="h-6 w-6 shrink-0 text-primary" />
							<div className="min-w-0 flex-1">
								<p className="truncate font-medium text-sm">
									{selectedFile.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{formatFileSize(selectedFile.size)}
									{parsedRows.length > 0 &&
										` · ${parsedRows.length} linhas lidas`}
								</p>
							</div>
						</div>
					)}

					{parsing && (
						<p className="text-xs text-muted-foreground">Lendo arquivo…</p>
					)}

					{/* Parse error */}
					{parseError && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{parseError}</AlertDescription>
						</Alert>
					)}

					{/* Mapping editor */}
					{fileHeaders.length > 0 && !parseError && (
						<div className="space-y-3">
							<div>
								<p className="text-sm font-medium">Mapeamento de Colunas</p>
								<p className="text-xs text-muted-foreground">
									Associe cada campo ao cabeçalho correspondente do seu arquivo.
								</p>
							</div>
							<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
								{SUPPLIER_FIELDS.map((field) => (
									<div key={field.key} className="flex flex-col gap-1">
										<Label
											htmlFor={`map-${field.key}`}
											className="text-xs flex items-center gap-1"
										>
											{field.label}
											{field.required && (
												<span className="text-destructive">*</span>
											)}
										</Label>
										<Select
											value={mapping[field.key] ?? "__ignore__"}
											onValueChange={(v) => handleMappingChange(field.key, v)}
											disabled={uploading}
										>
											<SelectTrigger
												id={`map-${field.key}`}
												className="h-8 text-xs"
											>
												<SelectValue placeholder="— ignorar —" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem
													value="__ignore__"
													className="text-xs text-muted-foreground"
												>
													— ignorar —
												</SelectItem>
												{fileHeaders.map((h) => (
													<SelectItem key={h} value={h} className="text-xs">
														{h}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								))}
							</div>
							{!nameIsMapped && (
								<Alert variant="destructive">
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										O campo <strong>Nome</strong> é obrigatório. Selecione a
										coluna correspondente ao nome do produto.
									</AlertDescription>
								</Alert>
							)}
						</div>
					)}

					{/* Preview */}
					{parsedRows.length > 0 && !parseError && (
						<div className="space-y-2">
							<p className="text-sm font-medium">Pré-visualização</p>
							<ImportPreview rows={parsedRows} mapping={mapping} />
						</div>
					)}

					{/* Upload progress */}
					{uploading && (
						<div className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>Processando arquivo...</span>
								<span>{uploadProgress}%</span>
							</div>
							<Progress value={uploadProgress} />
						</div>
					)}

					{/* Upload result */}
					{uploadResult && (
						<div
							className={cn(
								"flex items-start gap-3 rounded-lg p-4",
								uploadResult.success
									? "bg-success/10 text-success"
									: "bg-destructive/10 text-destructive",
							)}
						>
							{uploadResult.success ? (
								<CheckCircle className="h-5 w-5 mt-0.5 shrink-0" />
							) : (
								<AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
							)}
							<div>
								<p className="font-medium">
									{uploadResult.success ? "Upload Concluído" : "Erro no Upload"}
								</p>
								<p className="text-sm mt-1">{uploadResult.message}</p>
							</div>
						</div>
					)}

					{/* Actions */}
					{!done && (
						<div className="flex gap-3 flex-wrap">
							{hasData ? (
								<>
									<Button variant="outline" onClick={handleBack}>
										Voltar
									</Button>
									<Button
										onClick={handleUpload}
										disabled={!canUpload}
										className="flex-1"
									>
										{uploading ? "Processando..." : "Confirmar"}
									</Button>
								</>
							) : (
								<Button
									variant="outline"
									onClick={downloadTemplate}
									type="button"
									className="w-full"
								>
									<Download className="h-4 w-4 mr-2" />
									Baixar modelo
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
