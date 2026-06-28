"use client";

import { Building2, DollarSign, Package, Tags } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { EntityDetailModal } from "@/components/shared/entity-detail-modal";
import {
	getProductColumns,
	type Product,
	productDetailSections,
} from "@/components/shared/product-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatters } from "@/lib/utils/masks";

type User = {
	id: string;
	name: string;
	email: string;
	area: string;
	company: { id: string; name: string; type: string } | null;
};

interface ProductsClientProps {
	user: User;
}

interface Company {
	id: string;
	name: string;
	type: string;
}

export default function ProductsClient({ user: _user }: ProductsClientProps) {
	const [products, setProducts] = useState<Product[]>([]);
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [companyFilter, setCompanyFilter] = useState<string>("all");
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchProducts();
		fetchCompanies();
	}, []);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/products");
			if (!response.ok) throw new Error("Erro ao carregar produtos");
			const data = await response.json();
			setProducts(data.products ?? []);
		} catch (error) {
			console.error("Erro ao carregar produtos:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchCompanies = async () => {
		try {
			const response = await fetch("/api/companies");
			if (!response.ok) throw new Error("Erro ao carregar empresas");
			const data = await response.json();
			setCompanies(data.companies ?? []);
		} catch (error) {
			console.error("Erro ao carregar empresas:", error);
		}
	};

	const handleDeleteProduct = async (productId: string) => {
		if (!confirm("Tem certeza que deseja excluir este produto?")) return;
		try {
			const response = await fetch(`/api/products/${productId}`, {
				method: "DELETE",
			});
			if (response.ok) {
				fetchProducts();
			} else {
				console.error("Failed to delete product");
			}
		} catch (error) {
			console.error("Delete product error:", error);
		}
	};

	const openDetail = (product: Product) => {
		setSelectedProduct(product);
		setDetailOpen(true);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: delete handler is render-stable; columns built once
	const columns = useMemo(
		() =>
			getProductColumns({ onDelete: handleDeleteProduct, showCompany: true }),
		[],
	);

	const categories = useMemo(
		() => [...new Set(products.map((p) => p.category).filter(Boolean))],
		[products],
	);

	const filteredProducts = useMemo(
		() =>
			products.filter((product) => {
				const matchesCategory =
					categoryFilter === "all" || product.category === categoryFilter;
				const matchesCompany =
					companyFilter === "all" || product.company.id === companyFilter;
				return matchesCategory && matchesCompany;
			}),
		[products, categoryFilter, companyFilter],
	);

	// Indicadores: totais globais (não reagem aos filtros)
	const stats = useMemo(() => {
		const withPrice = products.filter((p) => typeof p.price === "number");
		const avgPrice = withPrice.length
			? withPrice.reduce((sum, p) => sum + (p.price ?? 0), 0) / withPrice.length
			: 0;
		return {
			total: products.length,
			companies: new Set(products.map((p) => p.company.id)).size,
			avgPrice,
		};
	}, [products]);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
					<p className="text-muted-foreground">
						Gerencie os produtos de todas as empresas
					</p>
				</div>
			</div>

			{/* Indicadores */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Total de Produtos"
					icon={Package}
					value={stats.total}
				/>
				<StatCard title="Categorias" icon={Tags} value={categories.length} />
				<StatCard title="Empresas" icon={Building2} value={stats.companies} />
				<StatCard
					title="Preço médio"
					icon={DollarSign}
					value={formatters.currency(stats.avgPrice)}
				/>
			</div>

			{/* Tabela */}
			<Card className="flex min-h-0 flex-1 flex-col">
				<CardHeader>
					<CardTitle>Lista de Produtos</CardTitle>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col">
					<DataTable
						columns={columns}
						data={filteredProducts}
						searchKey="name"
						searchPlaceholder="Buscar produtos..."
						onRowClick={openDetail}
						isLoading={loading}
						emptyState="Nenhum produto encontrado."
						toolbar={
							<>
								<Select
									value={categoryFilter}
									onValueChange={setCategoryFilter}
								>
									<SelectTrigger className="w-44">
										<SelectValue placeholder="Categoria" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todas as categorias</SelectItem>
										{categories
											.filter((c): c is string => Boolean(c))
											.map((category) => (
												<SelectItem key={category} value={category}>
													{category}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
								<Select value={companyFilter} onValueChange={setCompanyFilter}>
									<SelectTrigger className="w-44">
										<SelectValue placeholder="Empresa" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todas as empresas</SelectItem>
										{companies.map((company) => (
											<SelectItem key={company.id} value={company.id}>
												{company.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</>
						}
					/>
				</CardContent>
			</Card>

			{/* Modal de Detalhes */}
			<EntityDetailModal
				open={detailOpen}
				onOpenChange={setDetailOpen}
				record={selectedProduct}
				title="Detalhes do Produto"
				sections={productDetailSections}
				editHref={(p) => `/admin/products/${p.id}/editar`}
			/>
		</div>
	);
}
