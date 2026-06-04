"use client";

import { Building2, Package, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface Product {
	id: string;
	sku?: string;
	code?: string;
	name: string;
	price?: number;
	description?: string;
	category?: string;
	unit?: string;
	supplier: {
		id: string;
		name: string;
		type: string;
	};
}

interface ManualMatchDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	clientProduct: {
		id: string;
		name: string;
		sku?: string;
		code?: string;
		description?: string;
	};
	onMatch: (supplierProductId: string) => void;
}

export default function ManualMatchDialog({
	open,
	onOpenChange,
	clientProduct,
	onMatch,
}: ManualMatchDialogProps) {
	const [searchTerm, setSearchTerm] = useState("");
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: run when dialog opens / product changes
	useEffect(() => {
		if (open && clientProduct) {
			setSearchTerm(clientProduct.name);
			searchProducts(clientProduct.name);
		}
	}, [open, clientProduct]);

	const searchProducts = async (query: string) => {
		if (!query || query.trim().length < 2) {
			setProducts([]);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch(
				`/api/products/search?q=${encodeURIComponent(query.trim())}&limit=20`,
			);

			if (response.ok) {
				const data = await response.json();
				setProducts(data.products || []);
			} else {
				setProducts([]);
			}
		} catch (error) {
			console.error("Search error:", error);
			setProducts([]);
		} finally {
			setLoading(false);
		}
	};

	const handleSearchChange = (value: string) => {
		setSearchTerm(value);

		// Debounce search
		const timeoutId = setTimeout(() => {
			searchProducts(value);
		}, 300);

		return () => clearTimeout(timeoutId);
	};

	const handleMatch = () => {
		if (selectedProduct) {
			onMatch(selectedProduct);
			onOpenChange(false);
			setSelectedProduct(null);
			setSearchTerm("");
			setProducts([]);
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
			<DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Search className="h-5 w-5" />
						Buscar Produto Manualmente
					</DialogTitle>
				</DialogHeader>

				{/* Client Product Info */}
				<div className="p-4 bg-blue-50 rounded-lg">
					<h4 className="font-semibold text-blue-900 mb-2">
						Produto Procurado:
					</h4>
					<p className="text-blue-800">{clientProduct.name}</p>
					{(clientProduct.sku || clientProduct.code) && (
						<div className="flex gap-2 mt-1 text-sm text-blue-700">
							{clientProduct.sku && <span>SKU: {clientProduct.sku}</span>}
							{clientProduct.code && <span>Código: {clientProduct.code}</span>}
						</div>
					)}
				</div>

				{/* Search Input */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
					<Input
						placeholder="Digite para buscar produtos dos fornecedores..."
						value={searchTerm}
						onChange={(e) => handleSearchChange(e.target.value)}
						className="pl-10"
					/>
				</div>

				{/* Search Results */}
				<div className="flex-1 overflow-y-auto min-h-[300px]">
					{loading ? (
						<div className="flex items-center justify-center py-8">
							<div className="text-center">
								<Search className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
								<p className="text-gray-600">Buscando produtos...</p>
							</div>
						</div>
					) : products.length === 0 ? (
						<div className="flex items-center justify-center py-8">
							<div className="text-center text-gray-500">
								<Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
								<h3 className="text-lg font-semibold mb-2">
									{searchTerm.trim().length < 2
										? "Digite pelo menos 2 caracteres"
										: "Nenhum produto encontrado"}
								</h3>
								<p>
									{searchTerm.trim().length < 2
										? "Comece digitando para buscar produtos"
										: "Tente usar termos diferentes ou parciais"}
								</p>
							</div>
						</div>
					) : (
						<div className="space-y-2">
							{products.map((product) => (
								<button
									key={product.id}
									type="button"
									className={`w-full text-left p-4 border rounded-lg cursor-pointer transition-colors ${
										selectedProduct === product.id
											? "border-blue-500 bg-blue-50"
											: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
									}`}
									onClick={() => setSelectedProduct(product.id)}
								>
									<div className="flex justify-between items-start">
										<div className="flex-1 mr-4">
											<h4 className="font-semibold">{product.name}</h4>
											<div className="flex items-center gap-2 mt-1">
												<Building2 className="h-4 w-4 text-gray-500" />
												<span className="text-sm text-gray-600">
													{product.supplier.name}
												</span>
												<Badge variant="outline" className="text-xs">
													{product.supplier.type === "SUPPLIER"
														? "Fornecedor"
														: "Cliente"}
												</Badge>
											</div>
											<div className="flex gap-4 mt-2 text-sm text-gray-600">
												{product.sku && <span>SKU: {product.sku}</span>}
												{product.code && <span>Código: {product.code}</span>}
												{product.category && (
													<span>Categoria: {product.category}</span>
												)}
											</div>
											{product.description && (
												<p className="text-sm text-gray-600 mt-1 line-clamp-2">
													{product.description}
												</p>
											)}
										</div>
										{product.price && (
											<div className="text-right">
												<p className="font-bold text-lg text-green-600">
													{formatCurrency(product.price)}
												</p>
												{product.unit && (
													<p className="text-xs text-gray-500">
														por {product.unit}
													</p>
												)}
											</div>
										)}
									</div>
								</button>
							))}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancelar
					</Button>
					<Button onClick={handleMatch} disabled={!selectedProduct}>
						Associar Produto
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
