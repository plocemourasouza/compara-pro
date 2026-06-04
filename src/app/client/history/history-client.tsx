"use client";

import { Eye, FileText, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Upload {
	id: string;
	fileName: string;
	fileSize: number;
	uploadType: "SUPPLIER_PRODUCTS" | "CLIENT_REQUIREMENTS";
	status: "PROCESSING" | "COMPLETED" | "FAILED";
	isActive: boolean;
	priceChangeIndicator?: "UP" | "DOWN" | "SAME" | "FIRST_UPLOAD";
	totalRows: number;
	processedRows: number;
	errorRows: number;
	uploadedAt: string;
	processedAt?: string;
}

interface HistoryClientProps {
	user: User;
}

export default function HistoryClient({ user: _user }: HistoryClientProps) {
	const [uploads, setUploads] = useState<Upload[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
	const [detailDialog, setDetailDialog] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchHistory();
	}, []);

	const fetchHistory = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/upload/history");
			if (!response.ok) throw new Error("Erro ao carregar histórico");
			const data = await response.json();
			setUploads(data.uploads || []);
		} catch (error) {
			console.error("Erro ao carregar histórico:", error);
		} finally {
			setLoading(false);
		}
	};

	const reprocessUpload = async (uploadId: string) => {
		try {
			const response = await fetch(`/api/upload/${uploadId}/reprocess`, {
				method: "POST",
			});
			if (!response.ok) throw new Error("Erro ao reprocessar upload");
			fetchHistory();
		} catch (error) {
			console.error("Erro ao reprocessar upload:", error);
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "COMPLETED":
				return "✅";
			case "PROCESSING":
				return "⏳";
			case "FAILED":
				return "❌";
			default:
				return "❓";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "COMPLETED":
				return "Concluído";
			case "PROCESSING":
				return "Processando";
			case "FAILED":
				return "Falhou";
			default:
				return "Desconhecido";
		}
	};

	const getPriceChangeIcon = (indicator?: string) => {
		switch (indicator) {
			case "UP":
				return "📈";
			case "DOWN":
				return "📉";
			case "SAME":
				return "➡️";
			case "FIRST_UPLOAD":
				return "🆕";
			default:
				return "";
		}
	};

	const getPriceChangeLabel = (indicator?: string) => {
		switch (indicator) {
			case "UP":
				return "Preços subiram";
			case "DOWN":
				return "Preços baixaram";
			case "SAME":
				return "Preços mantidos";
			case "FIRST_UPLOAD":
				return "Primeiro upload";
			default:
				return "";
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
	};

	const filteredUploads = uploads.filter((upload) => {
		const matchesSearch = upload.fileName
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesStatus = !statusFilter || upload.status === statusFilter;
		const matchesType = !typeFilter || upload.uploadType === typeFilter;

		return matchesSearch && matchesStatus && matchesType;
	});

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg">Carregando histórico...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground">
					Histórico de Uploads
				</h1>
				<p className="text-muted-foreground">
					Visualize o histórico de todos os uploads realizados
				</p>
			</div>

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle>Filtros</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div>
							<Label htmlFor="search">Buscar</Label>
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="search"
									placeholder="Nome do arquivo..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="status-filter">Status</Label>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Todos os status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todos os status</SelectItem>
									<SelectItem value="COMPLETED">Concluído</SelectItem>
									<SelectItem value="PROCESSING">Processando</SelectItem>
									<SelectItem value="FAILED">Falhou</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="type-filter">Tipo</Label>
							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger>
									<SelectValue placeholder="Todos os tipos" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">Todos os tipos</SelectItem>
									<SelectItem value="SUPPLIER_PRODUCTS">
										Produtos do Fornecedor
									</SelectItem>
									<SelectItem value="CLIENT_REQUIREMENTS">
										Requisitos do Cliente
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-end">
							<Button
								variant="outline"
								onClick={() => {
									setSearchTerm("");
									setStatusFilter("");
									setTypeFilter("");
								}}
								className="w-full"
							>
								Limpar Filtros
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Lista de Uploads */}
			<div className="grid gap-4">
				{filteredUploads.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center h-32">
							<FileText className="h-8 w-8 text-muted-foreground mb-2" />
							<p className="text-muted-foreground">Nenhum upload encontrado</p>
						</CardContent>
					</Card>
				) : (
					filteredUploads.map((upload) => (
						<Card key={upload.id}>
							<CardContent className="p-6">
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<h3 className="text-lg font-semibold">
												{upload.fileName}
											</h3>
											<Badge
												variant={
													upload.status === "COMPLETED"
														? "default"
														: upload.status === "PROCESSING"
															? "secondary"
															: "destructive"
												}
											>
												{getStatusIcon(upload.status)}{" "}
												{getStatusLabel(upload.status)}
											</Badge>
											{upload.isActive && (
												<Badge variant="outline">Ativo</Badge>
											)}
											{upload.priceChangeIndicator && (
												<Badge variant="outline">
													{getPriceChangeIcon(upload.priceChangeIndicator)}{" "}
													{getPriceChangeLabel(upload.priceChangeIndicator)}
												</Badge>
											)}
										</div>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
											<div>
												<span className="font-medium">Tipo:</span>{" "}
												{upload.uploadType === "SUPPLIER_PRODUCTS"
													? "Produtos do Fornecedor"
													: "Requisitos do Cliente"}
											</div>
											<div>
												<span className="font-medium">Tamanho:</span>{" "}
												{formatFileSize(upload.fileSize)}
											</div>
											<div>
												<span className="font-medium">Linhas:</span>{" "}
												{upload.totalRows} total, {upload.processedRows}{" "}
												processadas
												{upload.errorRows > 0 && (
													<span className="text-destructive">
														, {upload.errorRows} com erro
													</span>
												)}
											</div>
											<div>
												<span className="font-medium">Upload:</span>{" "}
												{formatDate(upload.uploadedAt)}
											</div>
										</div>
										{upload.processedAt && (
											<div className="text-xs text-muted-foreground mt-2">
												Processado em: {formatDate(upload.processedAt)}
											</div>
										)}
									</div>
									<div className="flex gap-2 ml-4">
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setSelectedUpload(upload);
												setDetailDialog(true);
											}}
										>
											<Eye className="h-4 w-4" />
										</Button>
										{upload.status === "FAILED" && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => reprocessUpload(upload.id)}
											>
												<RefreshCw className="h-4 w-4" />
											</Button>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Dialog de Detalhes */}
			<Dialog open={detailDialog} onOpenChange={setDetailDialog}>
				<DialogContent className="sm:max-w-[600px]">
					<DialogHeader>
						<DialogTitle>Detalhes do Upload</DialogTitle>
					</DialogHeader>
					{selectedUpload && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="font-medium">Arquivo</Label>
									<p className="text-sm text-muted-foreground">
										{selectedUpload.fileName}
									</p>
								</div>
								<div>
									<Label className="font-medium">Status</Label>
									<p className="text-sm text-muted-foreground">
										{getStatusLabel(selectedUpload.status)}
									</p>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="font-medium">Tipo</Label>
									<p className="text-sm text-muted-foreground">
										{selectedUpload.uploadType === "SUPPLIER_PRODUCTS"
											? "Produtos do Fornecedor"
											: "Requisitos do Cliente"}
									</p>
								</div>
								<div>
									<Label className="font-medium">Tamanho</Label>
									<p className="text-sm text-muted-foreground">
										{formatFileSize(selectedUpload.fileSize)}
									</p>
								</div>
							</div>
							<div className="grid grid-cols-3 gap-4">
								<div>
									<Label className="font-medium">Total de Linhas</Label>
									<p className="text-sm text-muted-foreground">
										{selectedUpload.totalRows}
									</p>
								</div>
								<div>
									<Label className="font-medium">Processadas</Label>
									<p className="text-sm text-muted-foreground">
										{selectedUpload.processedRows}
									</p>
								</div>
								<div>
									<Label className="font-medium">Com Erro</Label>
									<p className="text-sm text-muted-foreground">
										{selectedUpload.errorRows}
									</p>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="font-medium">Data de Upload</Label>
									<p className="text-sm text-muted-foreground">
										{formatDate(selectedUpload.uploadedAt)}
									</p>
								</div>
								{selectedUpload.processedAt && (
									<div>
										<Label className="font-medium">Data de Processamento</Label>
										<p className="text-sm text-muted-foreground">
											{formatDate(selectedUpload.processedAt)}
										</p>
									</div>
								)}
							</div>
							{selectedUpload.priceChangeIndicator && (
								<div>
									<Label className="font-medium">Indicador de Preço</Label>
									<p className="text-sm text-muted-foreground">
										{getPriceChangeIcon(selectedUpload.priceChangeIndicator)}{" "}
										{getPriceChangeLabel(selectedUpload.priceChangeIndicator)}
									</p>
								</div>
							)}
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
