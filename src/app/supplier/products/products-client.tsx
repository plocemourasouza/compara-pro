"use client";

import {
	Building2,
	DollarSign,
	Edit,
	Package,
	Plus,
	Search,
	Trash2,
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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

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

interface Product {
	id: string;
	code?: string;
	sku?: string;
	name: string;
	price?: number;
	description?: string;
	category?: string;
	unit?: string;
	company: {
		id: string;
		name: string;
		type: string;
	};
	createdAt: string;
	updatedAt: string;
}

interface ProductsClientProps {
	user: User;
}

export default function ProductsClient({ user }: ProductsClientProps) {
	const [products, setProducts] = useState<Product[]>([]);
	const [companies, setCompanies] = useState<
		Array<{ id: string; name: string; type: string }>
	>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [categoryFilter, setCategoryFilter] = useState<string>("all");
	const [companyFilter, setCompanyFilter] = useState<string>("all");
	const [createDialog, setCreateDialog] = useState(false);
	const [editDialog, setEditDialog] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [formData, setFormData] = useState({
		code: "",
		sku: "",
		name: "",
		price: "",
		description: "",
		category: "",
		unit: "",
		companyId: "",
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: re-fetch when role changes
	useEffect(() => {
		fetchProducts();
		if (user.role === "ADMIN") {
			fetchCompanies();
		}
	}, [user.role]);

	const fetchProducts = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/products");

			if (response.ok) {
				const data = await response.json();
				setProducts(data.products);
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
				setCompanies(data.companies);
			} else {
				console.error("Failed to fetch companies");
			}
		} catch (error) {
			console.error("Fetch companies error:", error);
		}
	};

	const handleCreateProduct = async () => {
		try {
			setActionLoading(true);
			const productData = {
				...formData,
				price: formData.price ? Number.parseFloat(formData.price) : undefined,
				companyId:
					user.role === "ADMIN" ? formData.companyId : user.company?.id,
			};

			const response = await fetch("/api/products", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(productData),
			});

			if (response.ok) {
				setCreateDialog(false);
				setFormData({
					code: "",
					sku: "",
					name: "",
					price: "",
					description: "",
					category: "",
					unit: "",
					companyId: "",
				});
				fetchProducts();
			} else {
				console.error("Failed to create product");
			}
		} catch (error) {
			console.error("Create product error:", error);
		} finally {
			setActionLoading(false);
		}
	};

	const handleUpdateProduct = async () => {
		if (!selectedProduct) return;

		try {
			setActionLoading(true);
			const productData = {
				...formData,
				price: formData.price ? Number.parseFloat(formData.price) : undefined,
				companyId:
					user.role === "ADMIN" ? formData.companyId : user.company?.id,
			};

			const response = await fetch(`/api/products/${selectedProduct.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(productData),
			});

			if (response.ok) {
				setEditDialog(false);
				setSelectedProduct(null);
				setFormData({
					code: "",
					sku: "",
					name: "",
					price: "",
					description: "",
					category: "",
					unit: "",
					companyId: "",
				});
				fetchProducts();
			} else {
				console.error("Failed to update product");
			}
		} catch (error) {
			console.error("Update product error:", error);
		} finally {
			setActionLoading(false);
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

	const openEditDialog = (product: Product) => {
		setSelectedProduct(product);
		setFormData({
			code: product.code || "",
			sku: product.sku || "",
			name: product.name,
			price: product.price?.toString() || "",
			description: product.description || "",
			category: product.category || "",
			unit: product.unit || "",
			companyId: product.company.id,
		});
		setEditDialog(true);
	};

	const _resetForm = () => {
		setFormData({
			code: "",
			sku: "",
			name: "",
			price: "",
			description: "",
			category: "",
			unit: "",
			companyId: "",
		});
		setSelectedProduct(null);
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
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

	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.code?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesCategory =
			categoryFilter === "all" || product.category === categoryFilter;
		const matchesCompany =
			companyFilter === "all" || product.company.id === companyFilter;

		return matchesSearch && matchesCategory && matchesCompany;
	});

	const categories = [
		...new Set(products.map((p) => p.category).filter(Boolean)),
	];

	if (loading) {
		return (
			<div className="p-6">
				<div className="flex items-center justify-between mb-6">
					<h1 className="text-2xl font-bold">Produtos</h1>
					<Button disabled>
						<Plus className="mr-2 h-4 w-4" />
						Novo Produto
					</Button>
				</div>
				<div className="space-y-4">
					<div className="h-4 bg-gray-200 rounded animate-pulse" />
					<div className="h-4 bg-gray-200 rounded animate-pulse" />
					<div className="h-4 bg-gray-200 rounded animate-pulse" />
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Produtos</h1>
				<Dialog open={createDialog} onOpenChange={setCreateDialog}>
					<DialogTrigger asChild>
						<Button>
							<Plus className="mr-2 h-4 w-4" />
							Novo Produto
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>Criar Novo Produto</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="code">Código</Label>
									<Input
										id="code"
										value={formData.code}
										onChange={(e) =>
											setFormData({ ...formData, code: e.target.value })
										}
										placeholder="Código do produto"
									/>
								</div>
								<div>
									<Label htmlFor="sku">SKU</Label>
									<Input
										id="sku"
										value={formData.sku}
										onChange={(e) =>
											setFormData({ ...formData, sku: e.target.value })
										}
										placeholder="SKU do produto"
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="name">Nome do Produto *</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="Nome do produto"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="price">Preço</Label>
									<Input
										id="price"
										type="number"
										step="0.01"
										value={formData.price}
										onChange={(e) =>
											setFormData({ ...formData, price: e.target.value })
										}
										placeholder="0.00"
									/>
								</div>
								<div>
									<Label htmlFor="unit">Unidade</Label>
									<Input
										id="unit"
										value={formData.unit}
										onChange={(e) =>
											setFormData({ ...formData, unit: e.target.value })
										}
										placeholder="Unidade (kg, l, etc)"
									/>
								</div>
							</div>
							<div>
								<Label htmlFor="category">Categoria</Label>
								<Input
									id="category"
									value={formData.category}
									onChange={(e) =>
										setFormData({ ...formData, category: e.target.value })
									}
									placeholder="Categoria do produto"
								/>
							</div>
							<div>
								<Label htmlFor="description">Descrição</Label>
								<Textarea
									id="description"
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									placeholder="Descrição do produto"
									rows={3}
								/>
							</div>
							{user.role === "ADMIN" && (
								<div>
									<Label htmlFor="company">Empresa</Label>
									<Select
										value={formData.companyId}
										onValueChange={(value) =>
											setFormData({ ...formData, companyId: value })
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Selecione uma empresa" />
										</SelectTrigger>
										<SelectContent>
											{companies.map((company) => (
												<SelectItem key={company.id} value={company.id}>
													{company.name} (
													{company.type === "SUPPLIER"
														? "Fornecedor"
														: "Cliente"}
													)
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
							<div className="flex justify-end space-x-2">
								<Button
									variant="outline"
									onClick={() => setCreateDialog(false)}
								>
									Cancelar
								</Button>
								<Button
									onClick={handleCreateProduct}
									disabled={actionLoading || !formData.name}
								>
									{actionLoading ? "Criando..." : "Criar"}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Filters */}
			<div className="flex gap-4 mb-6">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
						<Input
							placeholder="Buscar produtos..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>
				<Select value={categoryFilter} onValueChange={setCategoryFilter}>
					<SelectTrigger className="w-48">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">Todas as categorias</SelectItem>
						{categories
							.filter((category): category is string => Boolean(category))
							.map((category) => (
								<SelectItem key={category} value={category}>
									{category}
								</SelectItem>
							))}
					</SelectContent>
				</Select>
				{user.role === "ADMIN" && (
					<Select value={companyFilter} onValueChange={setCompanyFilter}>
						<SelectTrigger className="w-48">
							<SelectValue />
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
				)}
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
						<div className="text-2xl font-bold">
							{new Set(products.map((p) => p.company.id)).size}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Valor Total</CardTitle>
						<DollarSign className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatCurrency(
								products.reduce((sum, p) => sum + (p.price || 0), 0),
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Products Table */}
			<Card>
				<CardHeader>
					<CardTitle>Lista de Produtos</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nome</TableHead>
								<TableHead>SKU/Código</TableHead>
								<TableHead>Preço</TableHead>
								<TableHead>Categoria</TableHead>
								{user.role === "ADMIN" && <TableHead>Empresa</TableHead>}
								<TableHead>Criado em</TableHead>
								<TableHead>Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredProducts.map((product) => (
								<TableRow key={product.id}>
									<TableCell className="font-medium">{product.name}</TableCell>
									<TableCell>
										<div className="space-y-1">
											{product.sku && (
												<div className="text-xs text-gray-500">
													SKU: {product.sku}
												</div>
											)}
											{product.code && (
												<div className="text-xs text-gray-500">
													Código: {product.code}
												</div>
											)}
										</div>
									</TableCell>
									<TableCell>
										{product.price ? formatCurrency(product.price) : "-"}
									</TableCell>
									<TableCell>{product.category || "-"}</TableCell>
									{user.role === "ADMIN" && (
										<TableCell>
											<Badge
												className={
													product.company.type === "SUPPLIER"
														? "bg-blue-100 text-blue-800"
														: "bg-green-100 text-green-800"
												}
											>
												{product.company.name}
											</Badge>
										</TableCell>
									)}
									<TableCell>{formatDate(product.createdAt)}</TableCell>
									<TableCell>
										<div className="flex space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => openEditDialog(product)}
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDeleteProduct(product.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Edit Dialog */}
			<Dialog open={editDialog} onOpenChange={setEditDialog}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Editar Produto</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="edit-code">Código</Label>
								<Input
									id="edit-code"
									value={formData.code}
									onChange={(e) =>
										setFormData({ ...formData, code: e.target.value })
									}
									placeholder="Código do produto"
								/>
							</div>
							<div>
								<Label htmlFor="edit-sku">SKU</Label>
								<Input
									id="edit-sku"
									value={formData.sku}
									onChange={(e) =>
										setFormData({ ...formData, sku: e.target.value })
									}
									placeholder="SKU do produto"
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="edit-name">Nome do Produto *</Label>
							<Input
								id="edit-name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Nome do produto"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="edit-price">Preço</Label>
								<Input
									id="edit-price"
									type="number"
									step="0.01"
									value={formData.price}
									onChange={(e) =>
										setFormData({ ...formData, price: e.target.value })
									}
									placeholder="0.00"
								/>
							</div>
							<div>
								<Label htmlFor="edit-unit">Unidade</Label>
								<Input
									id="edit-unit"
									value={formData.unit}
									onChange={(e) =>
										setFormData({ ...formData, unit: e.target.value })
									}
									placeholder="Unidade (kg, l, etc)"
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="edit-category">Categoria</Label>
							<Input
								id="edit-category"
								value={formData.category}
								onChange={(e) =>
									setFormData({ ...formData, category: e.target.value })
								}
								placeholder="Categoria do produto"
							/>
						</div>
						<div>
							<Label htmlFor="edit-description">Descrição</Label>
							<Textarea
								id="edit-description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
								placeholder="Descrição do produto"
								rows={3}
							/>
						</div>
						{user.role === "ADMIN" && (
							<div>
								<Label htmlFor="edit-company">Empresa</Label>
								<Select
									value={formData.companyId}
									onValueChange={(value) =>
										setFormData({ ...formData, companyId: value })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Selecione uma empresa" />
									</SelectTrigger>
									<SelectContent>
										{companies.map((company) => (
											<SelectItem key={company.id} value={company.id}>
												{company.name} (
												{company.type === "SUPPLIER" ? "Fornecedor" : "Cliente"}
												)
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={() => setEditDialog(false)}>
								Cancelar
							</Button>
							<Button
								onClick={handleUpdateProduct}
								disabled={actionLoading || !formData.name}
							>
								{actionLoading ? "Salvando..." : "Salvar"}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
