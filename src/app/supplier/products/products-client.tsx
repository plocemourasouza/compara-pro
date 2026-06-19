"use client";

import {
	Building2,
	ChevronDown,
	DollarSign,
	Package,
	Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EntityDetailModal } from "@/components/shared/entity-detail-modal";
import { ProductImportDialog } from "@/components/shared/product-import-dialog";
import {
	getProductColumns,
	type Product,
	productDetailSections,
} from "@/components/shared/product-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
	suppliers: { id: string; name: string }[];
}

export default function ProductsClient({
	user,
	suppliers,
}: ProductsClientProps) {
	const router = useRouter();
	const isAdmin = user.area === "ADMIN";
	const isRepresentative = user.area === "REPRESENTATIVE";
	const showCompany = isAdmin || isRepresentative;
	const [products, setProducts] = useState<Product[]>([]);
	const [companies, setCompanies] = useState<
		Array<{ id: string; name: string; type: string }>
	>([]);
	const [loading, setLoading] = useState(true);
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [companyFilter, setCompanyFilter] = useState<string>("all");
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-fetch when role changes
	useEffect(() => {
		fetchProducts();
		if (isAdmin) {
			fetchCompanies();
		}
	}, [isAdmin]);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/products");
			if (response.ok) {
				const data = await response.json();
				setProducts(data.products ?? []);
			} else {
				console.error("Failed to fetch products");
			}
		} catch (error) {
			console.error("Fetch products error:", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchCompanies = async () => {
		try {
			const response = await fetch("/api/companies");
			if (response.ok) {
				const data = await response.json();
				setCompanies(data.companies ?? []);
			}
		} catch (error) {
			console.error("Fetch companies error:", error);
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: delete handler is render-stable; only showCompany affects columns
	const columns = useMemo(
		() =>
			getProductColumns({
				onDelete: handleDeleteProduct,
				showCompany,
			}),
		[showCompany],
	);

	const categories = useMemo(
		() => [...new Set(products.map((p) => p.category).filter(Boolean))],
		[products],
	);

	// Admin filters across all companies; representative across the suppliers
	// that actually have products loaded.
	const companyOptions = useMemo(() => {
		if (isAdmin) return companies.map((c) => ({ id: c.id, name: c.name }));
		const map = new Map<string, string>();
		for (const p of products) map.set(p.company.id, p.company.name);
		return [...map].map(([id, name]) => ({ id, name }));
	}, [isAdmin, companies, products]);

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

	const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
	const uniqueCompanies = new Set(products.map((p) => p.company.id)).size;

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Novo Produto
							<ChevronDown className="ml-2 h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						align="end"
						className="w-(--radix-dropdown-menu-trigger-width) min-w-(--radix-dropdown-menu-trigger-width)"
					>
						<DropdownMenuItem
							className="justify-center"
							onClick={() => router.push("/supplier/products/novo")}
						>
							Individual
						</DropdownMenuItem>
						<DropdownMenuItem
							className="justify-center"
							onClick={() => setImportOpen(true)}
						>
							Importar
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total de Produtos
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{products.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Empresas</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{uniqueCompanies}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Valor Total</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatters.currency(totalValue)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabela */}
			<Card className="flex min-h-0 flex-1 flex-col">
				<CardHeader>
					<CardTitle>Lista de Produtos</CardTitle>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col pt-6">
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
								{showCompany && (
									<Select
										value={companyFilter}
										onValueChange={setCompanyFilter}
									>
										<SelectTrigger className="w-44">
											<SelectValue
												placeholder={isAdmin ? "Empresa" : "Fornecedor"}
											/>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">
												{isAdmin
													? "Todas as empresas"
													: "Todos os fornecedores"}
											</SelectItem>
											{companyOptions.map((company) => (
												<SelectItem key={company.id} value={company.id}>
													{company.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								)}
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
				editHref={(p) => `/supplier/products/${p.id}/editar`}
			/>

			{/* Modal de Importação */}
			<ProductImportDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				suppliers={suppliers}
				user={user}
				onImported={() => {
					fetchProducts();
				}}
			/>
		</div>
	);
}
