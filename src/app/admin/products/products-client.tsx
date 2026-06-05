"use client";

import { Edit, Package, Plus, Search, Trash2 } from "lucide-react";
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
	name: string;
	sku?: string;
	code?: string;
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

const INITIAL_FORM_DATA = {
	name: "",
	sku: "",
	code: "",
	price: "",
	description: "",
	category: "",
	unit: "",
	companyId: "",
};

interface Company {
	id: string;
	name: string;
}

export default function ProductsClient({ user: _user }: ProductsClientProps) {
	const [products, setProducts] = useState<Product[]>([]);
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("ALL");
	const [selectedCompany, setSelectedCompany] = useState("ALL");
	const [createDialog, setCreateDialog] = useState(false);
	const [editDialog, setEditDialog] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [formData, setFormData] = useState(INITIAL_FORM_DATA);

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
			setProducts(data.products || []);
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
			setCompanies(data.companies || []);
		} catch (error) {
			console.error("Erro ao carregar empresas:", error);
		}
	};

	const handleCreateProduct = async () => {
		try {
			const response = await fetch("/api/products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					price: formData.price ? parseFloat(formData.price) : undefined,
				}),
			});

			if (!response.ok) throw new Error("Erro ao criar produto");

			setCreateDialog(false);
			setFormData(INITIAL_FORM_DATA);
			fetchProducts();
		} catch (error) {
			console.error("Erro ao criar produto:", error);
		}
	};

	const handleUpdateProduct = async () => {
		if (!selectedProduct) return;

		try {
			const response = await fetch(`/api/products/${selectedProduct.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					price: formData.price ? parseFloat(formData.price) : undefined,
				}),
			});

			if (!response.ok) throw new Error("Erro ao atualizar produto");

			setEditDialog(false);
			setSelectedProduct(null);
			setFormData(INITIAL_FORM_DATA);
			fetchProducts();
		} catch (error) {
			console.error("Erro ao atualizar produto:", error);
		}
	};

	const handleDeleteProduct = async (productId: string) => {
		if (!confirm("Tem certeza que deseja excluir este produto?")) return;

		try {
			const response = await fetch(`/api/products/${productId}`, {
				method: "DELETE",
			});

			if (!response.ok) throw new Error("Erro ao excluir produto");

			fetchProducts();
		} catch (error) {
			console.error("Erro ao excluir produto:", error);
		}
	};

	const openEditDialog = (product: Product) => {
		setSelectedProduct(product);
		setFormData({
			name: product.name,
			sku: product.sku || "",
			code: product.code || "",
			price: product.price?.toString() || "",
			description: product.description || "",
			category: product.category || "",
			unit: product.unit || "",
			companyId: product.company?.id ?? "",
		});
		setEditDialog(true);
	};

	const resetForm = () => {
		setFormData(INITIAL_FORM_DATA);
		setSelectedProduct(null);
	};

	const filteredProducts = products.filter((product) => {
		const matchesSearch =
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.code?.toLowerCase().includes(searchTerm.toLowerCase());

		const matchesCategory =
			selectedCategory === "ALL" || product.category === selectedCategory;
		const matchesCompany =
			selectedCompany === "ALL" || product.company?.id === selectedCompany;

		return matchesSearch && matchesCategory && matchesCompany;
	});

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("pt-BR");
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-lg">Carregando produtos...</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Produtos</h1>
					<p className="text-muted-foreground">
						Gerencie todos os produtos do sistema
					</p>
				</div>
				<Dialog open={createDialog} onOpenChange={setCreateDialog}>
					<DialogTrigger asChild>
						<Button onClick={() => resetForm()}>
							<Plus className="mr-2 h-4 w-4" />
							Novo Produto
						</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-[500px]">
						<DialogHeader>
							<DialogTitle>Criar Novo Produto</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="name">Nome *</Label>
									<Input
										id="name"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
									/>
								</div>
								<div>
									<Label htmlFor="company">Empresa *</Label>
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
													{company.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="sku">SKU</Label>
									<Input
										id="sku"
										value={formData.sku}
										onChange={(e) =>
											setFormData({ ...formData, sku: e.target.value })
										}
									/>
								</div>
								<div>
									<Label htmlFor="code">Código</Label>
									<Input
										id="code"
										value={formData.code}
										onChange={(e) =>
											setFormData({ ...formData, code: e.target.value })
										}
									/>
								</div>
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
								/>
							</div>
						</div>
						<div className="flex justify-end space-x-2">
							<Button variant="outline" onClick={() => setCreateDialog(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreateProduct}>Criar Produto</Button>
						</div>
					</DialogContent>
				</Dialog>
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
									placeholder="Nome, SKU ou código..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div>
							<Label htmlFor="category-filter">Categoria</Label>
							<Select
								value={selectedCategory}
								onValueChange={setSelectedCategory}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todas as categorias" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Todas as categorias</SelectItem>
									{Array.from(
										new Set(
											products
												.map((p) => p.category)
												.filter(Boolean) as string[],
										),
									).map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="company-filter">Empresa</Label>
							<Select
								value={selectedCompany}
								onValueChange={setSelectedCompany}
							>
								<SelectTrigger>
									<SelectValue placeholder="Todas as empresas" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ALL">Todas as empresas</SelectItem>
									{companies.map((company) => (
										<SelectItem key={company.id} value={company.id}>
											{company.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="flex items-end">
							<Button
								variant="outline"
								onClick={() => {
									setSearchTerm("");
									setSelectedCategory("ALL");
									setSelectedCompany("ALL");
								}}
								className="w-full"
							>
								Limpar Filtros
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Lista de Produtos */}
			<div className="grid gap-4">
				{filteredProducts.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center h-32">
							<Package className="h-8 w-8 text-muted-foreground mb-2" />
							<p className="text-muted-foreground">Nenhum produto encontrado</p>
						</CardContent>
					</Card>
				) : (
					filteredProducts.map((product) => (
						<Card key={product.id}>
							<CardContent className="p-6">
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<h3 className="text-lg font-semibold">{product.name}</h3>
											{product.category && (
												<Badge variant="secondary">{product.category}</Badge>
											)}
										</div>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
											<div>
												<span className="font-medium">SKU:</span>{" "}
												{product.sku || "N/A"}
											</div>
											<div>
												<span className="font-medium">Código:</span>{" "}
												{product.code || "N/A"}
											</div>
											<div>
												<span className="font-medium">Preço:</span>{" "}
												{product.price ? formatCurrency(product.price) : "N/A"}
											</div>
											<div>
												<span className="font-medium">Empresa:</span>{" "}
												{product.company.name}
											</div>
										</div>
										{product.description && (
											<p className="text-sm text-muted-foreground mt-2">
												{product.description}
											</p>
										)}
										<div className="text-xs text-muted-foreground mt-2">
											Criado em: {formatDate(product.createdAt)}
										</div>
									</div>
									<div className="flex gap-2 ml-4">
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
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Dialog de Edição */}
			<Dialog open={editDialog} onOpenChange={setEditDialog}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Editar Produto</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="edit-name">Nome *</Label>
								<Input
									id="edit-name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
								/>
							</div>
							<div>
								<Label htmlFor="edit-company">Empresa *</Label>
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
												{company.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="edit-sku">SKU</Label>
								<Input
									id="edit-sku"
									value={formData.sku}
									onChange={(e) =>
										setFormData({ ...formData, sku: e.target.value })
									}
								/>
							</div>
							<div>
								<Label htmlFor="edit-code">Código</Label>
								<Input
									id="edit-code"
									value={formData.code}
									onChange={(e) =>
										setFormData({ ...formData, code: e.target.value })
									}
								/>
							</div>
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
							/>
						</div>
					</div>
					<div className="flex justify-end space-x-2">
						<Button variant="outline" onClick={() => setEditDialog(false)}>
							Cancelar
						</Button>
						<Button onClick={handleUpdateProduct}>Atualizar Produto</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
