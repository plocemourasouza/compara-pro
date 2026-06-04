"use client";

import { Building2, Package, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ClientProduct {
	id: string;
	name: string;
	sku?: string;
	code?: string;
}

interface SupplierProduct {
	id: string;
	name: string;
}

interface SupplierInfo {
	id: string;
	name: string;
}

interface Match {
	id: string;
	clientProduct: ClientProduct;
	bestPrice?: number;
	supplierMatches: Array<{
		id: string;
		price: number;
		product: SupplierProduct;
		supplier: SupplierInfo;
	}>;
}

interface CreatePreOrderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	comparisonId: string;
	supplier: {
		id: string;
		name: string;
	};
	matches: Match[];
	onSuccess: () => void;
}

export default function CreatePreOrderDialog({
	open,
	onOpenChange,
	comparisonId,
	supplier,
	matches,
	onSuccess,
}: CreatePreOrderDialogProps) {
	const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	const [notes, setNotes] = useState("");
	const [loading, setLoading] = useState(false);

	// Filter matches for this supplier
	const supplierMatches = matches.filter((match) =>
		match.supplierMatches.some((sm) => sm.supplier.id === supplier.id),
	);

	const handleMatchToggle = (matchId: string, checked: boolean) => {
		if (checked) {
			setSelectedMatches((prev) => [...prev, matchId]);
			setQuantities((prev) => ({ ...prev, [matchId]: 1 }));
		} else {
			setSelectedMatches((prev) => prev.filter((id) => id !== matchId));
			setQuantities((prev) => {
				const newQuantities = { ...prev };
				delete newQuantities[matchId];
				return newQuantities;
			});
		}
	};

	const handleQuantityChange = (matchId: string, quantity: number) => {
		if (quantity > 0) {
			setQuantities((prev) => ({ ...prev, [matchId]: quantity }));
		}
	};

	const calculateTotal = () => {
		return selectedMatches.reduce((total, matchId) => {
			const match = supplierMatches.find((m) => m.id === matchId);
			if (!match) return total;

			const supplierMatch = match.supplierMatches.find(
				(sm) => sm.supplier.id === supplier.id,
			);
			if (!supplierMatch) return total;

			const quantity = quantities[matchId] || 1;
			return total + supplierMatch.price * quantity;
		}, 0);
	};

	const handleCreatePreOrder = async () => {
		if (selectedMatches.length === 0) return;

		setLoading(true);
		try {
			const response = await fetch("/api/pre-order/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					comparisonId,
					supplierId: supplier.id,
					selectedMatches,
					quantities,
					notes: notes.trim() || undefined,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao criar pré-pedido");
			}

			onSuccess();
			onOpenChange(false);

			// Reset form
			setSelectedMatches([]);
			setQuantities({});
			setNotes("");
		} catch (error) {
			console.error("Create pre-order error:", error);
			alert(error instanceof Error ? error.message : "Erro desconhecido");
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<ShoppingCart className="h-5 w-5" />
						Criar Pré-pedido - {supplier.name}
					</DialogTitle>
				</DialogHeader>

				<div className="flex-1 overflow-y-auto space-y-4">
					{/* Supplier Info */}
					<div className="p-4 bg-primary/10 rounded-lg">
						<div className="flex items-center gap-2 mb-2">
							<Building2 className="h-5 w-5 text-primary" />
							<h4 className="font-semibold text-primary">Fornecedor</h4>
						</div>
						<p className="text-primary">{supplier.name}</p>
					</div>

					{/* Product Selection */}
					<div className="space-y-3">
						<h4 className="font-semibold flex items-center gap-2">
							<Package className="h-5 w-5" />
							Selecionar Produtos ({supplierMatches.length} disponíveis)
						</h4>

						{supplierMatches.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
								<p>Nenhum produto disponível para este fornecedor</p>
							</div>
						) : (
							<div className="space-y-3 max-h-96 overflow-y-auto">
								{supplierMatches.map((match) => {
									const supplierMatch = match.supplierMatches.find(
										(sm) => sm.supplier.id === supplier.id,
									);
									if (!supplierMatch) return null;

									const isSelected = selectedMatches.includes(match.id);
									const quantity = quantities[match.id] || 1;

									return (
										<div key={match.id} className="border rounded-lg p-4">
											<div className="flex items-start gap-3">
												<Checkbox
													checked={isSelected}
													onCheckedChange={(checked) =>
														handleMatchToggle(match.id, checked as boolean)
													}
													className="mt-1"
												/>

												<div className="flex-1">
													<h5 className="font-medium">
														{match.clientProduct.name}
													</h5>
													<div className="flex gap-2 text-sm text-muted-foreground mt-1">
														{match.clientProduct.sku && (
															<span>SKU: {match.clientProduct.sku}</span>
														)}
														{match.clientProduct.code && (
															<span>Código: {match.clientProduct.code}</span>
														)}
													</div>
													<div className="mt-2 text-sm text-muted-foreground">
														<span className="font-medium">
															Produto do fornecedor:
														</span>{" "}
														{supplierMatch.product.name}
													</div>
												</div>

												<div className="text-right">
													<div className="text-lg font-bold text-success">
														{formatCurrency(supplierMatch.price)}
													</div>
													{isSelected && (
														<div className="mt-2">
															<Label
																htmlFor={`qty-${match.id}`}
																className="text-sm"
															>
																Quantidade:
															</Label>
															<Input
																id={`qty-${match.id}`}
																type="number"
																min="1"
																value={quantity}
																onChange={(e) =>
																	handleQuantityChange(
																		match.id,
																		parseInt(e.target.value, 10) || 1,
																	)
																}
																className="w-20 mt-1"
															/>
															<div className="text-sm text-muted-foreground mt-1">
																Total:{" "}
																{formatCurrency(supplierMatch.price * quantity)}
															</div>
														</div>
													)}
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>

					{/* Order Summary */}
					{selectedMatches.length > 0 && (
						<div className="p-4 bg-success/10 rounded-lg">
							<h4 className="font-semibold text-success mb-2">
								Resumo do Pedido
							</h4>
							<div className="flex justify-between items-center">
								<span className="text-success">
									{selectedMatches.length} produtos selecionados
								</span>
								<span className="text-xl font-bold text-success">
									Total: {formatCurrency(calculateTotal())}
								</span>
							</div>
						</div>
					)}

					{/* Notes */}
					<div>
						<Label htmlFor="notes" className="text-sm font-medium">
							Observações (opcional)
						</Label>
						<Textarea
							id="notes"
							placeholder="Adicione observações sobre o pedido..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							className="mt-1"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancelar
					</Button>
					<Button
						onClick={handleCreatePreOrder}
						disabled={selectedMatches.length === 0 || loading}
					>
						{loading
							? "Criando..."
							: `Criar Pré-pedido (${selectedMatches.length} itens)`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
