"use client";

import {
	ArrowUpDown,
	Calendar,
	CheckCircle,
	Clock,
	Download,
	Eye,
	FileSpreadsheet,
	FileText,
	Filter,
	Minus,
	RefreshCw,
	Search,
	TrendingDown,
	TrendingUp,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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

interface UploadDetail {
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
	products: Array<{
		id: string;
		sku?: string;
		code?: string;
		name: string;
		price?: number;
		category?: string;
	}>;
	errors?: Array<{
		row: number;
		error: string;
	}>;
}

export default function HistoryClient({ user }: HistoryClientProps) {
	const [uploads, setUploads] = useState<Upload[]>([]);
	const [filteredUploads, setFilteredUploads] = useState<Upload[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedUpload, setSelectedUpload] = useState<UploadDetail | null>(
		null,
	);
	const [detailLoading, setDetailLoading] = useState(false);

	// Filtros
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
	const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchHistory();
	}, []);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-filter when inputs change
	useEffect(() => {
		applyFilters();
	}, [uploads, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

	const fetchHistory = async () => {
		try {
			const response = await fetch("/api/upload/history");

			if (!response.ok) {
				throw new Error("Erro ao carregar histórico");
			}

			const data = await response.json();
			setUploads(data.uploads);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		} finally {
			setLoading(false);
		}
	};

	const applyFilters = () => {
		let filtered = [...uploads];

		// Filtro por busca
		if (searchTerm) {
			filtered = filtered.filter((upload) =>
				upload.fileName.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		}

		// Filtro por status
		if (statusFilter !== "all") {
			filtered = filtered.filter((upload) => upload.status === statusFilter);
		}

		// Filtro por tipo
		if (typeFilter !== "all") {
			filtered = filtered.filter((upload) => upload.uploadType === typeFilter);
		}

		// Ordenação
		filtered.sort((a, b) => {
			let comparison = 0;

			switch (sortBy) {
				case "date":
					comparison =
						new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
					break;
				case "name":
					comparison = a.fileName.localeCompare(b.fileName);
					break;
				case "size":
					comparison = a.fileSize - b.fileSize;
					break;
			}

			return sortOrder === "asc" ? comparison : -comparison;
		});

		setFilteredUploads(filtered);
	};

	const fetchUploadDetail = async (uploadId: string) => {
		setDetailLoading(true);
		try {
			const response = await fetch(`/api/upload/${uploadId}/detail`);

			if (!response.ok) {
				throw new Error("Erro ao carregar detalhes");
			}

			const data = await response.json();
			setSelectedUpload(data.upload);
		} catch (err) {
			console.error("Erro ao carregar detalhes:", err);
		} finally {
			setDetailLoading(false);
		}
	};

	const reprocessUpload = async (uploadId: string) => {
		try {
			const response = await fetch(`/api/upload/${uploadId}/reprocess`, {
				method: "POST",
			});

			if (!response.ok) {
				throw new Error("Erro ao reprocessar upload");
			}

			// Atualizar a lista
			await fetchHistory();
		} catch (err) {
			console.error("Erro ao reprocessar:", err);
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "COMPLETED":
				return <CheckCircle className="h-4 w-4 text-success" />;
			case "FAILED":
				return <XCircle className="h-4 w-4 text-destructive" />;
			case "PROCESSING":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			default:
				return null;
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "COMPLETED":
				return "Concluído";
			case "FAILED":
				return "Falhou";
			case "PROCESSING":
				return "Processando";
			default:
				return status;
		}
	};

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
				return "Preços ↑";
			case "DOWN":
				return "Preços ↓";
			case "SAME":
				return "Preços =";
			case "FIRST_UPLOAD":
				return "Primeiro";
			default:
				return "";
		}
	};

	const formatDate = (dateString: string) => {
		return new Intl.DateTimeFormat("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(dateString));
	};

	const formatFileSize = (bytes: number) => {
		const mb = bytes / 1024 / 1024;
		return `${mb.toFixed(2)} MB`;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
					<p>Carregando histórico...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center text-destructive">
					<XCircle className="h-8 w-8 mx-auto mb-2" />
					<p>{error}</p>
					<Button onClick={fetchHistory} className="mt-4">
						Tentar Novamente
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Histórico de Uploads</h1>
				<p className="text-muted-foreground">
					Acompanhe todos os seus uploads anteriores
				</p>
			</div>

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Filter className="h-5 w-5" />
						Filtros
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<div className="space-y-2">
							<p className="text-sm font-medium">Buscar</p>
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Nome do arquivo..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-9"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Status</p>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos</SelectItem>
									<SelectItem value="COMPLETED">Concluído</SelectItem>
									<SelectItem value="PROCESSING">Processando</SelectItem>
									<SelectItem value="FAILED">Falhou</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Tipo</p>
							<Select value={typeFilter} onValueChange={setTypeFilter}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos</SelectItem>
									<SelectItem value="SUPPLIER_PRODUCTS">Produtos</SelectItem>
									<SelectItem value="CLIENT_REQUIREMENTS">
										Requisições
									</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<p className="text-sm font-medium">Ordenar por</p>
							<div className="flex gap-2">
								<Select
									value={sortBy}
									onValueChange={(value: "date" | "name" | "size") =>
										setSortBy(value)
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="date">Data</SelectItem>
										<SelectItem value="name">Nome</SelectItem>
										<SelectItem value="size">Tamanho</SelectItem>
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setSortOrder(sortOrder === "asc" ? "desc" : "asc")
									}
								>
									<ArrowUpDown className="h-4 w-4" />
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{uploads.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<FileSpreadsheet className="h-16 w-16 text-muted-foreground mb-4" />
						<h3 className="text-lg font-semibold text-muted-foreground mb-2">
							Nenhum upload realizado
						</h3>
						<p className="text-muted-foreground text-center">
							Quando você fizer upload de arquivos, eles aparecerão aqui.
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<p className="text-sm text-muted-foreground">
							{filteredUploads.length} de {uploads.length} uploads
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={fetchHistory}
							disabled={loading}
						>
							<RefreshCw
								className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
							/>
							Atualizar
						</Button>
					</div>

					{filteredUploads.map((upload) => (
						<Card
							key={upload.id}
							className={upload.isActive ? "ring-2 ring-primary" : ""}
						>
							<CardHeader className="pb-3">
								<div className="flex items-center justify-between">
									<CardTitle className="flex items-center gap-2">
										<FileText className="h-5 w-5" />
										{upload.fileName}
										{upload.isActive && (
											<Badge
												variant="secondary"
												className="bg-primary/10 text-primary"
											>
												Ativo
											</Badge>
										)}
									</CardTitle>
									<div className="flex items-center gap-2">
										{getStatusIcon(upload.status)}
										<Badge
											variant={
												upload.status === "COMPLETED"
													? "default"
													: upload.status === "FAILED"
														? "destructive"
														: "secondary"
											}
										>
											{getStatusLabel(upload.status)}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
									<div>
										<p className="text-sm text-muted-foreground">Tamanho</p>
										<p className="font-medium">
											{formatFileSize(upload.fileSize)}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Total de Linhas
										</p>
										<p className="font-medium">{upload.totalRows}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Processadas</p>
										<p className="font-medium text-success">
											{upload.processedRows}
										</p>
									</div>
									{upload.errorRows > 0 && (
										<div>
											<p className="text-sm text-muted-foreground">Erros</p>
											<p className="font-medium text-destructive">
												{upload.errorRows}
											</p>
										</div>
									)}
								</div>

								<div className="flex items-center justify-between">
									<div className="flex items-center gap-4 text-sm text-muted-foreground">
										<div className="flex items-center gap-1">
											<Calendar className="h-4 w-4" />
											{formatDate(upload.uploadedAt)}
										</div>
										{upload.priceChangeIndicator &&
											user.role === "SUPPLIER" && (
												<div className="flex items-center gap-1">
													{getPriceChangeIcon(upload.priceChangeIndicator)}
													<span>
														{getPriceChangeLabel(upload.priceChangeIndicator)}
													</span>
												</div>
											)}
									</div>

									<div className="flex gap-2">
										<Dialog>
											<DialogTrigger asChild>
												<Button
													variant="outline"
													size="sm"
													onClick={() => fetchUploadDetail(upload.id)}
												>
													<Eye className="h-4 w-4 mr-2" />
													Detalhes
												</Button>
											</DialogTrigger>
											<DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
												<DialogHeader>
													<DialogTitle>Detalhes do Upload</DialogTitle>
												</DialogHeader>
												{detailLoading ? (
													<div className="flex items-center justify-center p-8">
														<Clock className="h-8 w-8 animate-spin text-primary" />
													</div>
												) : selectedUpload ? (
													<div className="space-y-6">
														{/* Informações Gerais */}
														<div className="grid grid-cols-2 gap-4">
															<div>
																<h4 className="font-semibold mb-2">
																	Informações Gerais
																</h4>
																<div className="space-y-2 text-sm">
																	<div>
																		<strong>Arquivo:</strong>{" "}
																		{selectedUpload.fileName}
																	</div>
																	<div>
																		<strong>Tamanho:</strong>{" "}
																		{formatFileSize(selectedUpload.fileSize)}
																	</div>
																	<div>
																		<strong>Status:</strong>{" "}
																		{getStatusLabel(selectedUpload.status)}
																	</div>
																	<div>
																		<strong>Upload:</strong>{" "}
																		{formatDate(selectedUpload.uploadedAt)}
																	</div>
																	{selectedUpload.processedAt && (
																		<div>
																			<strong>Processado:</strong>{" "}
																			{formatDate(selectedUpload.processedAt)}
																		</div>
																	)}
																</div>
															</div>
															<div>
																<h4 className="font-semibold mb-2">
																	Estatísticas
																</h4>
																<div className="space-y-2 text-sm">
																	<div>
																		<strong>Total de linhas:</strong>{" "}
																		{selectedUpload.totalRows}
																	</div>
																	<div>
																		<strong>Processadas:</strong>{" "}
																		{selectedUpload.processedRows}
																	</div>
																	<div>
																		<strong>Com erro:</strong>{" "}
																		{selectedUpload.errorRows}
																	</div>
																	<div>
																		<strong>Taxa de sucesso:</strong>{" "}
																		{(
																			(selectedUpload.processedRows /
																				selectedUpload.totalRows) *
																			100
																		).toFixed(1)}
																		%
																	</div>
																</div>
															</div>
														</div>

														{/* Produtos (primeiros 10) */}
														{selectedUpload.products &&
															selectedUpload.products.length > 0 && (
																<div>
																	<h4 className="font-semibold mb-2">
																		Produtos (primeiros 10)
																	</h4>
																	<div className="border rounded-lg overflow-hidden">
																		<table className="w-full text-sm">
																			<thead className="bg-muted">
																				<tr>
																					<th className="px-3 py-2 text-left">
																						SKU
																					</th>
																					<th className="px-3 py-2 text-left">
																						Nome
																					</th>
																					<th className="px-3 py-2 text-left">
																						Preço
																					</th>
																					<th className="px-3 py-2 text-left">
																						Categoria
																					</th>
																				</tr>
																			</thead>
																			<tbody>
																				{selectedUpload.products
																					.slice(0, 10)
																					.map((product, index) => (
																						<tr
																							key={product.id}
																							className={
																								index % 2 === 0
																									? "bg-white"
																									: "bg-muted"
																							}
																						>
																							<td className="px-3 py-2">
																								{product.sku ||
																									product.code ||
																									"-"}
																							</td>
																							<td className="px-3 py-2">
																								{product.name}
																							</td>
																							<td className="px-3 py-2">
																								{product.price
																									? `R$ ${product.price.toFixed(2)}`
																									: "-"}
																							</td>
																							<td className="px-3 py-2">
																								{product.category || "-"}
																							</td>
																						</tr>
																					))}
																			</tbody>
																		</table>
																	</div>
																	{selectedUpload.products.length > 10 && (
																		<p className="text-sm text-muted-foreground mt-2">
																			E mais{" "}
																			{selectedUpload.products.length - 10}{" "}
																			produtos...
																		</p>
																	)}
																</div>
															)}

														{/* Erros */}
														{selectedUpload.errors &&
															selectedUpload.errors.length > 0 && (
																<div>
																	<h4 className="font-semibold mb-2">
																		Erros Encontrados
																	</h4>
																	<div className="border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
																		<table className="w-full text-sm">
																			<thead className="bg-destructive/10">
																				<tr>
																					<th className="px-3 py-2 text-left">
																						Linha
																					</th>
																					<th className="px-3 py-2 text-left">
																						Erro
																					</th>
																				</tr>
																			</thead>
																			<tbody>
																				{selectedUpload.errors.map(
																					(error, index) => (
																						<tr
																							key={error.row}
																							className={
																								index % 2 === 0
																									? "bg-white"
																									: "bg-destructive/10"
																							}
																						>
																							<td className="px-3 py-2">
																								{error.row}
																							</td>
																							<td className="px-3 py-2">
																								{error.error}
																							</td>
																						</tr>
																					),
																				)}
																			</tbody>
																		</table>
																	</div>
																</div>
															)}
													</div>
												) : null}
											</DialogContent>
										</Dialog>

										{upload.status === "FAILED" && (
											<Button
												variant="outline"
												size="sm"
												onClick={() => reprocessUpload(upload.id)}
											>
												<RefreshCw className="h-4 w-4 mr-2" />
												Reprocessar
											</Button>
										)}

										<Button variant="outline" size="sm">
											<Download className="h-4 w-4 mr-2" />
											Download
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
