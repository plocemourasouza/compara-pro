"use client";

import {
	AlertCircle,
	BarChart3,
	CheckCircle,
	Filter,
	PiggyBank,
	Plus,
	Search,
	ShoppingCart,
	TrendingUp,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ParecerPanel from "@/components/compare/parecer-panel";
import ManualMatchDialog from "@/components/shared/manual-match-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { calcItemSavings, calcTotalSavings } from "@/lib/savings";

type User = {
	id: string;
	name: string;
	email: string;
	area: string;
	company: { id: string; name: string; type: string } | null;
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
	targetPrice?: number | null;
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

interface Selection {
	included: boolean;
	supplierId: string;
	quantity: number;
}

interface GroupSummary {
	supplierId: string;
	name: string;
	itens: number;
	total: number;
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
	const [selections, setSelections] = useState<Record<string, Selection>>({});
	const [notes, setNotes] = useState("");
	const [confirming, setConfirming] = useState(false);
	const [manualMatchDialog, setManualMatchDialog] = useState<{
		open: boolean;
		clientProduct?: ClientProduct;
	}>({ open: false });

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchUploads();
	}, []);

	async function fetchUploads() {
		try {
			const response = await fetch(
				"/api/upload/history?type=CLIENT_REQUIREMENTS",
			);
			if (!response.ok) throw new Error("Erro ao carregar uploads");
			const data = await response.json();
			setUploads(data.uploads.filter((u: Upload) => u.status === "COMPLETED"));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		}
	}

	function initSelections(matches: Match[]) {
		const next: Record<string, Selection> = {};
		for (const m of matches) {
			if (m.supplierMatches.length === 0) continue;
			let best: SupplierMatch | undefined;
			for (const sm of m.supplierMatches) {
				if (!best || sm.price < best.price) best = sm;
			}
			if (best) {
				next[m.id] = {
					included: true,
					supplierId: best.supplier.id,
					quantity: 1,
				};
			}
		}
		setSelections(next);
	}

	const createComparison = async () => {
		if (!selectedUpload) return;
		setLoading(true);
		setError(null);
		setComparison(null);
		setNotes("");
		try {
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

			const comparisonResponse = await fetch(
				`/api/comparison/${createResult.comparisonId}`,
			);
			if (!comparisonResponse.ok) {
				throw new Error("Erro ao carregar comparação");
			}
			const comparisonData: Comparison = await comparisonResponse.json();
			setComparison(comparisonData);
			initSelections(comparisonData.matches);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Erro desconhecido");
		} finally {
			setLoading(false);
		}
	};

	const updateSel = (matchId: string, patch: Partial<Selection>) => {
		setSelections((prev) => {
			const cur = prev[matchId];
			if (!cur) return prev;
			return { ...prev, [matchId]: { ...cur, ...patch } };
		});
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
				return "bg-success/10 text-success";
			case "CODE":
				return "bg-primary/10 text-primary";
			case "NAME":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-destructive/10 text-destructive";
		}
	};

	const filteredMatches =
		comparison?.matches.filter((match) => {
			if (searchTerm) {
				const searchLower = searchTerm.toLowerCase();
				const matchesSearch =
					match.clientProduct.name.toLowerCase().includes(searchLower) ||
					match.clientProduct.sku?.toLowerCase().includes(searchLower) ||
					match.clientProduct.code?.toLowerCase().includes(searchLower);
				if (!matchesSearch) return false;
			}
			if (filterType === "MATCHED" && match.supplierMatches.length === 0)
				return false;
			if (filterType === "UNMATCHED" && match.supplierMatches.length > 0)
				return false;
			return true;
		}) || [];

	const handleManualMatch = (clientProduct: ClientProduct) => {
		setManualMatchDialog({ open: true, clientProduct });
	};

	const handleMatchProduct = async (supplierProductId: string) => {
		const clientProduct = manualMatchDialog.clientProduct;
		if (!comparison || !clientProduct) return;
		setLoading(true);
		try {
			const { createManualMatchAction } = await import(
				"@/lib/actions/matching"
			);
			// clientProduct.id é o UploadedProduct.id (não o id da comparação).
			const result = await createManualMatchAction(
				comparison.id,
				supplierProductId,
				clientProduct.id,
			);
			if (result.success) {
				setManualMatchDialog({ open: false });
				// Recarrega a comparação p/ refletir o novo match na UI (e reconstrói
				// as seleções p/ o produto recém-associado aparecer como casado).
				const res = await fetch(`/api/comparison/${comparison.id}`, {
					credentials: "include",
				});
				if (res.ok) {
					const data = await res.json();
					setComparison(data);
					initSelections(data.matches);
				}
			} else {
				console.error("Manual match error:", result.error);
			}
		} catch (err) {
			console.error("Manual match error:", err);
		} finally {
			setLoading(false);
		}
	};

	const chosenSupplierMatch = (m: Match): SupplierMatch | undefined => {
		const sel = selections[m.id];
		if (!sel) return undefined;
		return m.supplierMatches.find((sm) => sm.supplier.id === sel.supplierId);
	};

	const groupSummary = (): GroupSummary[] => {
		if (!comparison) return [];
		const map = new Map<string, GroupSummary>();
		for (const m of comparison.matches) {
			const sel = selections[m.id];
			if (!sel?.included) continue;
			const sm = m.supplierMatches.find(
				(s) => s.supplier.id === sel.supplierId,
			);
			if (!sm) continue;
			const cur = map.get(sel.supplierId) ?? {
				supplierId: sel.supplierId,
				name: sm.supplier.name,
				itens: 0,
				total: 0,
			};
			cur.itens += 1;
			cur.total += sm.price * sel.quantity;
			map.set(sel.supplierId, cur);
		}
		return Array.from(map.values());
	};

	const confirmPreOrders = async () => {
		if (!comparison) return;
		const groupsMap = new Map<
			string,
			{
				supplierId: string;
				selectedMatches: string[];
				quantities: Record<string, number>;
			}
		>();
		for (const m of comparison.matches) {
			const sel = selections[m.id];
			if (!sel?.included) continue;
			const sm = m.supplierMatches.find(
				(s) => s.supplier.id === sel.supplierId,
			);
			if (!sm) continue;
			const g = groupsMap.get(sel.supplierId) ?? {
				supplierId: sel.supplierId,
				selectedMatches: [],
				quantities: {},
			};
			g.selectedMatches.push(m.id);
			g.quantities[m.id] = sel.quantity;
			groupsMap.set(sel.supplierId, g);
		}
		const groups = Array.from(groupsMap.values());
		if (groups.length === 0) {
			toast.error("Selecione ao menos um produto");
			return;
		}
		setConfirming(true);
		try {
			const res = await fetch("/api/pre-order/create-batch", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					comparisonId: comparison.id,
					groups,
					notes: notes || undefined,
				}),
			});
			const data = (await res.json()) as {
				preOrderIds?: string[];
				error?: string;
			};
			if (!res.ok) throw new Error(data.error ?? "Erro ao criar pré-pedido");
			toast.success(
				`${data.preOrderIds?.length ?? 0} pré-pedido(s) criado(s) com sucesso`,
			);
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Erro ao criar pré-pedido",
			);
		} finally {
			setConfirming(false);
		}
	};

	const groups = groupSummary();
	const grandTotal = groups.reduce((sum, g) => sum + g.total, 0);
	const totalItens = groups.reduce((sum, g) => sum + g.itens, 0);
	const totalSavings = comparison
		? calcTotalSavings(comparison.matches, selections)
		: 0;

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Comparação de Preços
				</h1>
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

			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{comparison && (
				<>
					{/* Stats Summary */}
					<div
						className={`grid grid-cols-1 gap-4 ${
							totalSavings > 0 ? "md:grid-cols-5" : "md:grid-cols-4"
						}`}
					>
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center">
									<div className="p-2 bg-primary/10 rounded-lg">
										<BarChart3 className="h-6 w-6 text-primary" />
									</div>
									<div className="ml-4">
										<p className="text-sm font-medium text-muted-foreground">
											Total
										</p>
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
									<div className="p-2 bg-success/10 rounded-lg">
										<CheckCircle className="h-6 w-6 text-success" />
									</div>
									<div className="ml-4">
										<p className="text-sm font-medium text-muted-foreground">
											Encontrados
										</p>
										<p className="text-2xl font-bold text-success">
											{comparison.matchedProducts}
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center">
									<div className="p-2 bg-destructive/10 rounded-lg">
										<XCircle className="h-6 w-6 text-destructive" />
									</div>
									<div className="ml-4">
										<p className="text-sm font-medium text-muted-foreground">
											Não Encontrados
										</p>
										<p className="text-2xl font-bold text-destructive">
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
										<p className="text-sm font-medium text-muted-foreground">
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
						{totalSavings > 0 && (
							<Card>
								<CardContent className="p-6">
									<div className="flex items-center">
										<div className="p-2 bg-green-100 rounded-lg">
											<PiggyBank className="h-6 w-6 text-green-600" />
										</div>
										<div className="ml-4">
											<p className="text-sm font-medium text-muted-foreground">
												Economia
											</p>
											<p className="text-2xl font-bold text-green-600">
												{formatCurrency(totalSavings)}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						)}
					</div>

					{comparison.matchedProducts === 0 && (
						<Alert>
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>
								Nenhum item casou com a sua carteira de fornecedores.{" "}
								<Link
									href="/client/suppliers"
									className="font-medium underline"
								>
									Adicione fornecedores
								</Link>{" "}
								para comparar preços.
							</AlertDescription>
						</Alert>
					)}

					{/* AI parecer */}
					<ParecerPanel comparisonId={comparison.id} />

					{/* Filters */}
					<Card>
						<CardContent className="p-4">
							<div className="flex gap-4 items-center">
								<div className="flex-1">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
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

					{/* Results — inline override per product */}
					<Card>
						<CardHeader>
							<CardTitle>Resultados da Comparação</CardTitle>
							<p className="text-sm text-muted-foreground">
								Ajuste o fornecedor, a quantidade ou desmarque itens antes de
								confirmar o pré-pedido.
							</p>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{filteredMatches.map((match) => {
									const sel = selections[match.id];
									const chosen = chosenSupplierMatch(match);
									const above =
										chosen && match.bestPrice
											? chosen.price - match.bestPrice
											: 0;
									const itemSavings = sel
										? calcItemSavings(
												match.clientProduct.targetPrice,
												chosen?.price,
												sel.quantity,
											)
										: 0;
									return (
										<div key={match.id} className="border rounded-lg p-4">
											<div className="flex justify-between items-start mb-3">
												<div className="flex-1">
													<h4 className="font-semibold">
														{match.clientProduct.name}
													</h4>
													<div className="flex gap-2 text-sm text-muted-foreground mt-1">
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

											{match.supplierMatches.length > 0 && sel ? (
												<div className="flex flex-col gap-3 rounded bg-muted/40 p-3 sm:flex-row sm:items-end">
													<span className="flex items-center gap-2 text-sm">
														<Checkbox
															checked={sel.included}
															onCheckedChange={(c) =>
																updateSel(match.id, { included: c === true })
															}
														/>
														Incluir
													</span>
													<div className="flex-1">
														<span className="text-xs text-muted-foreground">
															Fornecedor
														</span>
														<Select
															value={sel.supplierId}
															onValueChange={(v) =>
																updateSel(match.id, { supplierId: v })
															}
														>
															<SelectTrigger>
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																{match.supplierMatches.map((sm) => (
																	<SelectItem
																		key={sm.id}
																		value={sm.supplier.id}
																	>
																		{sm.supplier.name} —{" "}
																		{formatCurrency(sm.price)}
																	</SelectItem>
																))}
															</SelectContent>
														</Select>
														{above > 0 && (
															<p className="mt-1 text-xs text-destructive">
																+{formatCurrency(above)} acima do melhor preço
															</p>
														)}
													</div>
													<div className="w-24">
														<span className="text-xs text-muted-foreground">
															Quantidade
														</span>
														<Input
															type="number"
															min={1}
															value={sel.quantity}
															onChange={(e) =>
																updateSel(match.id, {
																	quantity: Math.max(
																		1,
																		Number(e.target.value) || 1,
																	),
																})
															}
														/>
													</div>
													<div className="text-right">
														<span className="text-xs text-muted-foreground">
															Subtotal
														</span>
														<p className="font-bold">
															{formatCurrency(
																(chosen?.price ?? 0) * sel.quantity,
															)}
														</p>
														{itemSavings > 0 && (
															<p className="text-xs font-medium text-green-600">
																Economia {formatCurrency(itemSavings)}
															</p>
														)}
													</div>
												</div>
											) : (
												<div className="text-center p-4 text-muted-foreground">
													<XCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
													<p>Produto não encontrado nos fornecedores</p>
													<Button
														variant="outline"
														size="sm"
														className="mt-2"
														onClick={() =>
															handleManualMatch(match.clientProduct)
														}
													>
														<Plus className="h-4 w-4 mr-2" />
														Buscar Manualmente
													</Button>
												</div>
											)}
										</div>
									);
								})}
							</div>

							{filteredMatches.length === 0 && (
								<div className="text-center py-8 text-muted-foreground">
									<Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
									<h3 className="text-lg font-semibold mb-2">
										Nenhum resultado encontrado
									</h3>
									<p>Tente ajustar os filtros ou o termo de busca.</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Confirm pre-order */}
					{groups.length > 0 && (
						<Card className="border-primary">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShoppingCart className="h-5 w-5 text-primary" />
									Confirmar pré-pedido
								</CardTitle>
								<p className="text-sm text-muted-foreground">
									Suas escolhas geram {groups.length} pré-pedido(s), agrupados
									por fornecedor.
								</p>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									{groups.map((g) => (
										<div
											key={g.supplierId}
											className="flex items-center justify-between rounded border border-border px-3 py-2 text-sm"
										>
											<span className="font-medium">{g.name}</span>
											<span className="text-muted-foreground">
												{g.itens} item(ns) · {formatCurrency(g.total)}
											</span>
										</div>
									))}
								</div>
								<Textarea
									placeholder="Observações (opcional)"
									value={notes}
									onChange={(e) => setNotes(e.target.value)}
								/>
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm text-muted-foreground">
											Total ({totalItens} item(ns))
										</p>
										<p className="text-2xl font-bold">
											{formatCurrency(grandTotal)}
										</p>
									</div>
									<Button
										size="lg"
										onClick={confirmPreOrders}
										disabled={confirming}
									>
										{confirming ? "Enviando..." : "Confirmar pré-pedido"}
									</Button>
								</div>
							</CardContent>
						</Card>
					)}
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
		</div>
	);
}
