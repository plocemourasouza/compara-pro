"use client";

import {
	AlertCircle,
	BarChart3,
	CheckCircle,
	Filter,
	Plus,
	Search,
	ShoppingCart,
	TrendingUp,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import CreatePreOrderDialog from "@/components/shared/create-pre-order-dialog";
import ManualMatchDialog from "@/components/shared/manual-match-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	uploadedAt: string;
	totalRows: number;
	status: string;
}

interface Comparison {
	id: string;
	totalProducts: number;
	matchedProducts: number;
	unmatchedProducts: number;
	bestPriceTotal?: number;
	createdAt: string;
	matches: Match[];
}

interface ClientProduct {
	id: string;
	name: string;
	sku?: string;
	code?: string;
}

interface SupplierProduct {
	id: string;
	name: string;
	sku?: string;
	code?: string;
}

interface SupplierInfo {
	id: string;
	name: string;
}

interface Match {
	id: string;
	clientProduct: ClientProduct;
	matchType: "SKU" | "CODE" | "NAME" | "NONE";
	confidence: number;
	bestPrice?: number;
	supplierMatches: SupplierMatch[];
}

interface SupplierMatch {
	id: string;
	price: number;
	product: SupplierProduct;
	supplier: SupplierInfo;
}

interface CompareClientProps {
	user: User;
}

export default function CompareClient({ user: _user }: CompareClientProps) {
	const [uploads, setUploads] = useState<Upload[]>([]);
	const [selectedUpload, setSelectedUpload] = useState<string>("");
	const [comparison, setComparison] = useState<Comparison | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState<"ALL" | "MATCHED" | "UNMATCHED">(
		"ALL",
	);
	const [manualMatchDialog, setManualMatchDialog] = useState<{
		open: boolean;
		clientProduct?: ClientProduct;
	}>({ open: false });
	const [preOrderDialog, setPreOrderDialog] = useState<{
		open: boolean;
		supplier?: { id: string; name: string };
	}>({ open: false });

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchUploads();
	}, []);

	const fetchUploads = async () => {
		try {
			const response = await fetch(
				"/api/upload/history?type=CLIENT_REQUIREMENTS",
			);

			if (!response.ok) {
				throw new Error("Erro ao carregar uploads");
			}

			const data = await response.json();
			setUploads(data.uploads.filter((u: Upload) => u.status === "COMPLETED"));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		}
	};

	const createComparison = async () => {
		if (!selectedUpload) return;

		setLoading(true);
		setError(null);
		setComparison(null);

		try {
			// Create comparison
			const createResponse = await fetch("/api/comparison/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ uploadId: selectedUpload }),
			});

			if (!createResponse.ok) {
				const errorData = await createResponse.json();
				throw new Error(errorData.error);
			}

			const createResult = await createResponse.json();

			// Fetch comparison details
			const comparisonResponse = await fetch(
				`/api/comparison/${createResult.comparisonId}`,
			);

			if (!comparisonResponse.ok) {
				throw new Error("Erro ao carregar comparação");
			}

			const comparisonData = await comparisonResponse.json();
			setComparison(comparisonData);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		} finally {
			setLoading(false);
		}
	};

	const getMatchTypeLabel = (type: string) => {
		switch (type) {
			case "SKU":
				return "SKU";
			case "CODE":
				return "Código";
			case "NAME":
				return "Nome";
			default:
				return "Não encontrado";
		}
	};

	const getMatchTypeColor = (type: string) => {
		switch (type) {
			case "SKU":
				return "bg-green-100 text-green-800";
			case "CODE":
				return "bg-blue-100 text-blue-800";
			case "NAME":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-red-100 text-red-800";
		}
	};

	const filteredMatches =
		comparison?.matches.filter((match) => {
			// Filter by search term
			if (searchTerm) {
				const searchLower = searchTerm.toLowerCase();
				const matchesSearch =
					match.clientProduct.name.toLowerCase().includes(searchLower) ||
					match.clientProduct.sku?.toLowerCase().includes(searchLower) ||
					match.clientProduct.code?.toLowerCase().includes(searchLower);
				if (!matchesSearch) return false;
			}

			// Filter by match type
			if (filterType === "MATCHED" && match.supplierMatches.length === 0)
				return false;
			if (filterType === "UNMATCHED" && match.supplierMatches.length > 0)
				return false;

			return true;
		}) || [];

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const handleManualMatch = (clientProduct: ClientProduct) => {
		setManualMatchDialog({
			open: true,
			clientProduct,
		});
	};

	const handleMatchProduct = async (supplierProductId: string) => {
		if (!comparison) return;

		setLoading(true);
		try {
			const { createManualMatchAction } = await import(
				"@/lib/actions/matching"
			);
			const result = await createManualMatchAction(
				comparison.id,
				supplierProductId,
				comparison.id, // This would need the actual client product ID
			);

			if (result.success) {
				// Refresh the comparison data
				setComparison(null);
				// Show success message
			} else {
				console.error("Manual match error:", result.error);
			}
		} catch (error) {
			console.error("Manual match error:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleCreatePreOrder = (supplier: { id: string; name: string }) => {
		setPreOrderDialog({
			open: true,
			supplier,
		});
	};

	const handlePreOrderSuccess = () => {
		alert("Pré-pedido criado com sucesso!");
		// Could refresh comparison or navigate to orders page
	};

	// Get unique suppliers from comparison matches
	const getAvailableSuppliers = () => {
		if (!comparison) return [];

		const suppliersMap = new Map();

		comparison.matches.forEach((match) => {
			match.supplierMatches.forEach((sm) => {
				if (!suppliersMap.has(sm.supplier.id)) {
					suppliersMap.set(sm.supplier.id, {
						id: sm.supplier.id,
						name: sm.supplier.name,
						matchCount: 0,
					});
				}
				suppliersMap.get(sm.supplier.id).matchCount++;
			});
		});

		return Array.from(suppliersMap.values()).sort(
			(a, b) => b.matchCount - a.matchCount,
		);
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Comparação de Preços</h1>
				<p className="text-muted-foreground">
					Compare os preços dos seus produtos com diferentes fornecedores
				</p>
			</div>

			{/* Upload Selection */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Selecionar Lista para Comparação
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex gap-4 items-end">
						<div className="flex-1">
							<p className="text-sm font-medium mb-2">Lista de Produtos</p>
							<Select value={selectedUpload} onValueChange={setSelectedUpload}>
								<SelectTrigger>
									<SelectValue placeholder="Selecione uma lista..." />
								</SelectTrigger>
								<SelectContent>
									{uploads.map((upload) => (
										<SelectItem key={upload.id} value={upload.id}>
											{upload.fileName} ({upload.totalRows} produtos)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<Button
							onClick={createComparison}
							disabled={!selectedUpload || loading}
							className="min-w-[140px]"
						>
							{loading ? "Comparando..." : "Comparar Preços"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Error Display */}
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{/* Comparison Results */}
			{comparison && (
				<>
					{/* Stats Summary */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center">
									<div className="p-2 bg-blue-100 rounded-lg">
										<BarChart3 className="h-6 w-6 text-blue-600" />
									</div>
									<div className="ml-4">
										<p className="text-sm font-medium text-gray-600">Total</p>
										<p className="text-2xl font-bold">
											{comparison.totalProducts}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center">
									<div className="p-2 bg-green-100 rounded-lg">
										<CheckCircle className="h-6 w-6 text-green-600" />
									</div>
									<div className="ml-4">
										<p className="text-sm font-medium text-gray-600">
											Encontrados
										</p>
										<p className="text-2xl font-bold text-green-600">
											{comparison.matchedProducts}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center">
									<div className="p-2 bg-red-100 rounded-lg">
										<XCircle className="h-6 w-6 text-red-600" />
									</div>
									<div className="ml-4">
										<p className="text-sm font-medium text-gray-600">
											Não Encontrados
										</p>
										<p className="text-2xl font-bold text-red-600">
											{comparison.unmatchedProducts}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center">
									<div className="p-2 bg-yellow-100 rounded-lg">
										<TrendingUp className="h-6 w-6 text-yellow-600" />
									</div>
									<div className="ml-4">
										<p className="text-sm font-medium text-gray-600">
											Valor Total
										</p>
										<p className="text-2xl font-bold text-yellow-600">
											{comparison.bestPriceTotal
												? formatCurrency(comparison.bestPriceTotal)
												: "-"}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Filters */}
					<Card>
						<CardContent className="p-4">
							<div className="flex gap-4 items-center">
								<div className="flex-1">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
										<Input
											placeholder="Buscar produto..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-10"
										/>
									</div>
								</div>
								<Select
									value={filterType}
									onValueChange={(value: "ALL" | "MATCHED" | "UNMATCHED") =>
										setFilterType(value)
									}
								>
									<SelectTrigger className="w-[200px]">
										<Filter className="h-4 w-4 mr-2" />
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ALL">Todos</SelectItem>
										<SelectItem value="MATCHED">Com Match</SelectItem>
										<SelectItem value="UNMATCHED">Sem Match</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</CardContent>
					</Card>

					{/* Pre-order Actions */}
					{comparison && comparison.matchedProducts > 0 && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShoppingCart className="h-5 w-5" />
									Criar Pré-pedidos
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4">
									Selecione um fornecedor para criar um pré-pedido com os
									produtos encontrados:
								</p>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
									{getAvailableSuppliers().map((supplier) => (
										<Button
											key={supplier.id}
											variant="outline"
											onClick={() => handleCreatePreOrder(supplier)}
											className="flex items-center justify-between p-4 h-auto"
										>
											<div className="text-left">
												<div className="font-medium">{supplier.name}</div>
												<div className="text-sm text-muted-foreground">
													{supplier.matchCount} produtos disponíveis
												</div>
											</div>
											<ShoppingCart className="h-4 w-4" />
										</Button>
									))}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Results Table */}
					<Card>
						<CardHeader>
							<CardTitle>Resultados da Comparação</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{filteredMatches.map((match) => (
									<div key={match.id} className="border rounded-lg p-4">
										<div className="flex justify-between items-start mb-3">
											<div className="flex-1">
												<h4 className="font-semibold">
													{match.clientProduct.name}
												</h4>
												<div className="flex gap-2 text-sm text-gray-600 mt-1">
													{match.clientProduct.sku && (
														<span>SKU: {match.clientProduct.sku}</span>
													)}
													{match.clientProduct.code && (
														<span>Código: {match.clientProduct.code}</span>
													)}
												</div>
											</div>
											<div className="flex items-center gap-2">
												<Badge className={getMatchTypeColor(match.matchType)}>
													{getMatchTypeLabel(match.matchType)}
												</Badge>
												{match.bestPrice && (
													<Badge variant="outline" className="font-semibold">
														Melhor: {formatCurrency(match.bestPrice)}
													</Badge>
												)}
											</div>
										</div>

										{match.supplierMatches.length > 0 ? (
											<div className="grid gap-2">
												{match.supplierMatches.map((supplierMatch) => (
													<div
														key={supplierMatch.id}
														className="flex justify-between items-center p-3 bg-gray-50 rounded"
													>
														<div>
															<p className="font-medium">
																{supplierMatch.supplier.name}
															</p>
															<p className="text-sm text-gray-600">
																{supplierMatch.product.name}
															</p>
														</div>
														<div className="text-right">
															<p
																className={`font-bold ${supplierMatch.price === match.bestPrice ? "text-green-600" : "text-gray-900"}`}
															>
																{formatCurrency(supplierMatch.price)}
															</p>
														</div>
													</div>
												))}
											</div>
										) : (
											<div className="text-center p-4 text-gray-500">
												<XCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
												<p>Produto não encontrado nos fornecedores</p>
												<Button
													variant="outline"
													size="sm"
													className="mt-2"
													onClick={() => handleManualMatch(match.clientProduct)}
												>
													<Plus className="h-4 w-4 mr-2" />
													Buscar Manualmente
												</Button>
											</div>
										)}
									</div>
								))}
							</div>

							{filteredMatches.length === 0 && (
								<div className="text-center py-8 text-gray-500">
									<Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
									<h3 className="text-lg font-semibold mb-2">
										Nenhum resultado encontrado
									</h3>
									<p>Tente ajustar os filtros ou o termo de busca.</p>
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}

			{/* Manual Match Dialog */}
			{manualMatchDialog.clientProduct && (
				<ManualMatchDialog
					open={manualMatchDialog.open}
					onOpenChange={(open) => setManualMatchDialog({ open })}
					clientProduct={manualMatchDialog.clientProduct}
					onMatch={handleMatchProduct}
				/>
			)}

			{/* Create Pre-order Dialog */}
			{preOrderDialog.supplier && comparison && (
				<CreatePreOrderDialog
					open={preOrderDialog.open}
					onOpenChange={(open) => setPreOrderDialog({ open })}
					comparisonId={comparison.id}
					supplier={preOrderDialog.supplier}
					matches={comparison.matches}
					onSuccess={handlePreOrderSuccess}
				/>
			)}
		</div>
	);
}
