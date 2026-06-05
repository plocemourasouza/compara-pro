"use client";

import {
	Building2,
	Edit,
	Mail,
	MapPin,
	Package,
	Phone,
	Plus,
	Search,
	Trash2,
	User,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Separator } from "@/components/ui/separator";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { masks } from "@/lib/utils/masks";

interface UserType {
	id: string;
	name: string;
	email: string;
	role: string;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
}

interface Company {
	id: string;
	name: string;
	legalName?: string;
	cnpj?: string;
	type: "SUPPLIER" | "CLIENT";
	taxRegime?: "MEI" | "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";
	email?: string;
	phone?: string;
	responsibleName?: string;
	responsibleEmail?: string;
	responsiblePhone?: string;
	addressType?: string;
	street?: string;
	number?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	zipCode?: string;
	addressReference?: string;
	users?: Array<{
		id: string;
		name: string;
		email: string;
		role: string;
	}>;
	products?: Array<{
		id: string;
		name: string;
		sku?: string;
		code?: string;
	}>;
	_count?: {
		users: number;
		products: number;
	};
	createdAt: string;
	updatedAt: string;
}

interface CompaniesClientProps {
	user: UserType;
}

const brazilianStates = [
	"AC",
	"AL",
	"AP",
	"AM",
	"BA",
	"CE",
	"DF",
	"ES",
	"GO",
	"MA",
	"MT",
	"MS",
	"MG",
	"PA",
	"PB",
	"PR",
	"PE",
	"PI",
	"RJ",
	"RN",
	"RS",
	"RO",
	"RR",
	"SC",
	"SP",
	"SE",
	"TO",
];

const addressTypes = [
	"Rua",
	"Avenida",
	"Travessa",
	"Alameda",
	"Praça",
	"Estrada",
	"Rodovia",
	"Largo",
	"Quadra",
	"Conjunto",
	"Lote",
	"Sítio",
];

const taxRegimes = [
	{ value: "MEI", label: "MEI" },
	{ value: "SIMPLES_NACIONAL", label: "Simples Nacional" },
	{ value: "LUCRO_PRESUMIDO", label: "Lucro Presumido" },
	{ value: "LUCRO_REAL", label: "Lucro Real" },
];

export default function CompaniesClient({ user: _user }: CompaniesClientProps) {
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [createDialog, setCreateDialog] = useState(false);
	const [editDialog, setEditDialog] = useState(false);
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [actionLoading, setActionLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		legalName: "",
		cnpj: "",
		type: "SUPPLIER" as "SUPPLIER" | "CLIENT",
		taxRegime: "SIMPLES_NACIONAL" as
			| "MEI"
			| "SIMPLES_NACIONAL"
			| "LUCRO_PRESUMIDO"
			| "LUCRO_REAL",
		email: "",
		phone: "",
		responsibleName: "",
		responsibleEmail: "",
		responsiblePhone: "",
		addressType: "Rua",
		street: "",
		number: "",
		neighborhood: "",
		city: "",
		state: "SP",
		zipCode: "",
		addressReference: "",
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchCompanies();
	}, []);

	const fetchCompanies = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/companies");

			if (response.ok) {
				const data = await response.json();
				setCompanies(data.companies ?? []);
			} else {
				toast.error("Erro ao carregar empresas");
			}
		} catch (error) {
			console.error("Error fetching companies:", error);
			toast.error("Erro ao carregar empresas");
		} finally {
			setLoading(false);
		}
	};

	const handleCreateCompany = async () => {
		try {
			setActionLoading(true);

			const response = await fetch("/api/companies", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				toast.success("Empresa criada com sucesso!");
				setCreateDialog(false);
				resetForm();
				fetchCompanies();
			} else {
				const data = await response.json();
				toast.error(data.error || "Erro ao criar empresa");
			}
		} catch (error) {
			console.error("Error creating company:", error);
			toast.error("Erro ao criar empresa");
		} finally {
			setActionLoading(false);
		}
	};

	const handleUpdateCompany = async () => {
		if (!selectedCompany) return;

		try {
			setActionLoading(true);

			const response = await fetch(`/api/companies/${selectedCompany.id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (response.ok) {
				toast.success("Empresa atualizada com sucesso!");
				setEditDialog(false);
				resetForm();
				fetchCompanies();
			} else {
				const data = await response.json();
				toast.error(data.error || "Erro ao atualizar empresa");
			}
		} catch (error) {
			console.error("Error updating company:", error);
			toast.error("Erro ao atualizar empresa");
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteCompany = async (companyId: string) => {
		if (!confirm("Tem certeza que deseja excluir esta empresa?")) {
			return;
		}

		try {
			const response = await fetch(`/api/companies/${companyId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Empresa excluída com sucesso!");
				fetchCompanies();
			} else {
				const data = await response.json();
				toast.error(data.error || "Erro ao excluir empresa");
			}
		} catch (error) {
			console.error("Error deleting company:", error);
			toast.error("Erro ao excluir empresa");
		}
	};

	const openEditDialog = (company: Company) => {
		setSelectedCompany(company);
		setFormData({
			name: company.name,
			legalName: company.legalName || "",
			cnpj: company.cnpj || "",
			type: company.type,
			taxRegime: company.taxRegime || "SIMPLES_NACIONAL",
			email: company.email || "",
			phone: company.phone || "",
			responsibleName: company.responsibleName || "",
			responsibleEmail: company.responsibleEmail || "",
			responsiblePhone: company.responsiblePhone || "",
			addressType: company.addressType || "Rua",
			street: company.street || "",
			number: company.number || "",
			neighborhood: company.neighborhood || "",
			city: company.city || "",
			state: company.state || "SP",
			zipCode: company.zipCode || "",
			addressReference: company.addressReference || "",
		});
		setEditDialog(true);
	};

	const resetForm = () => {
		setFormData({
			name: "",
			legalName: "",
			cnpj: "",
			type: "SUPPLIER",
			taxRegime: "SIMPLES_NACIONAL",
			email: "",
			phone: "",
			responsibleName: "",
			responsibleEmail: "",
			responsiblePhone: "",
			addressType: "Rua",
			street: "",
			number: "",
			neighborhood: "",
			city: "",
			state: "SP",
			zipCode: "",
			addressReference: "",
		});
		setSelectedCompany(null);
	};

	const getTypeLabel = (type: string) => {
		switch (type) {
			case "SUPPLIER":
				return "Fornecedor";
			case "CLIENT":
				return "Cliente";
			default:
				return type;
		}
	};

	const getTypeBadgeColor = (type: string) => {
		switch (type) {
			case "SUPPLIER":
				return "bg-primary/10 text-primary hover:bg-primary/20";
			case "CLIENT":
				return "bg-success/10 text-success hover:bg-success/20";
			default:
				return "bg-muted text-muted-foreground hover:bg-secondary";
		}
	};

	const getTaxRegimeLabel = (regime: string) => {
		const found = taxRegimes.find((r) => r.value === regime);
		return found ? found.label : regime;
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("pt-BR");
	};

	const formatCNPJ = (cnpj: string) => {
		return cnpj.replace(
			/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
			"$1.$2.$3/$4-$5",
		);
	};

	const formatPhone = (phone: string) => {
		const cleaned = phone.replace(/\D/g, "");
		if (cleaned.length === 11) {
			return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
		}
		if (cleaned.length === 10) {
			return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
		}
		return phone;
	};

	const formatCEP = (cep: string) => {
		return cep.replace(/^(\d{5})(\d{3})$/, "$1-$2");
	};

	const filteredCompanies = companies.filter((company) => {
		const matchesSearch =
			company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			company.legalName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			company.cnpj?.includes(searchTerm) ||
			company.city?.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType = typeFilter === "all" || company.type === typeFilter;
		return matchesSearch && matchesType;
	});

	const CompanyForm = () => (
		<div className="space-y-6 max-h-[70vh] overflow-y-auto">
			{/* Dados básicos da empresa */}
			<div>
				<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
					<Building2 className="h-5 w-5" />
					Dados da Empresa
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="name">Nome Fantasia *</Label>
						<Input
							id="name"
							placeholder="Nome fantasia da empresa"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="legalName">Razão Social *</Label>
						<Input
							id="legalName"
							placeholder="Razão social da empresa"
							value={formData.legalName}
							onChange={(e) =>
								setFormData({ ...formData, legalName: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="cnpj">CNPJ *</Label>
						<Input
							id="cnpj"
							placeholder="00.000.000/0000-00"
							value={formData.cnpj}
							onChange={(e) =>
								setFormData({ ...formData, cnpj: masks.cnpj(e.target.value) })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="type">Tipo *</Label>
						<Select
							value={formData.type}
							onValueChange={(value: "SUPPLIER" | "CLIENT") =>
								setFormData({ ...formData, type: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="SUPPLIER">Fornecedor</SelectItem>
								<SelectItem value="CLIENT">Cliente</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="taxRegime">Enquadramento Tributário *</Label>
						<Select
							value={formData.taxRegime}
							onValueChange={(
								value:
									| "MEI"
									| "SIMPLES_NACIONAL"
									| "LUCRO_PRESUMIDO"
									| "LUCRO_REAL",
							) => setFormData({ ...formData, taxRegime: value })}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{taxRegimes.map((regime) => (
									<SelectItem key={regime.value} value={regime.value}>
										{regime.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">E-mail da Empresa</Label>
						<Input
							id="email"
							type="email"
							placeholder="empresa@exemplo.com"
							value={formData.email}
							onChange={(e) =>
								setFormData({ ...formData, email: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Telefone da Empresa</Label>
						<Input
							id="phone"
							placeholder="(11) 99999-9999"
							value={formData.phone}
							onChange={(e) =>
								setFormData({ ...formData, phone: masks.phone(e.target.value) })
							}
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* Dados do responsável */}
			<div>
				<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
					<User className="h-5 w-5" />
					Dados do Responsável
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="responsibleName">Nome do Responsável *</Label>
						<Input
							id="responsibleName"
							placeholder="Nome completo"
							value={formData.responsibleName}
							onChange={(e) =>
								setFormData({ ...formData, responsibleName: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="responsibleEmail">E-mail do Responsável *</Label>
						<Input
							id="responsibleEmail"
							type="email"
							placeholder="responsavel@exemplo.com"
							value={formData.responsibleEmail}
							onChange={(e) =>
								setFormData({ ...formData, responsibleEmail: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="responsiblePhone">Telefone do Responsável *</Label>
						<Input
							id="responsiblePhone"
							placeholder="(11) 99999-9999"
							value={formData.responsiblePhone}
							onChange={(e) =>
								setFormData({ ...formData, responsiblePhone: e.target.value })
							}
						/>
					</div>
				</div>
			</div>

			<Separator />

			{/* Endereço */}
			<div>
				<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
					<MapPin className="h-5 w-5" />
					Dados de Localização
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div className="space-y-2">
						<Label htmlFor="addressType">Tipo de Logradouro *</Label>
						<Select
							value={formData.addressType}
							onValueChange={(value) =>
								setFormData({ ...formData, addressType: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{addressTypes.map((type) => (
									<SelectItem key={type} value={type}>
										{type}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2 md:col-span-2">
						<Label htmlFor="street">Logradouro *</Label>
						<Input
							id="street"
							placeholder="Nome da rua, avenida, etc."
							value={formData.street}
							onChange={(e) =>
								setFormData({ ...formData, street: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="number">Número *</Label>
						<Input
							id="number"
							placeholder="123"
							value={formData.number}
							onChange={(e) =>
								setFormData({ ...formData, number: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="neighborhood">Bairro *</Label>
						<Input
							id="neighborhood"
							placeholder="Nome do bairro"
							value={formData.neighborhood}
							onChange={(e) =>
								setFormData({ ...formData, neighborhood: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="city">Cidade *</Label>
						<Input
							id="city"
							placeholder="Nome da cidade"
							value={formData.city}
							onChange={(e) =>
								setFormData({ ...formData, city: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="state">Estado *</Label>
						<Select
							value={formData.state}
							onValueChange={(value) =>
								setFormData({ ...formData, state: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{brazilianStates.map((state) => (
									<SelectItem key={state} value={state}>
										{state}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="zipCode">CEP *</Label>
						<Input
							id="zipCode"
							placeholder="00000-000"
							value={formData.zipCode}
							onChange={(e) =>
								setFormData({ ...formData, zipCode: e.target.value })
							}
						/>
					</div>
					<div className="space-y-2 md:col-span-2">
						<Label htmlFor="addressReference">Referência</Label>
						<Input
							id="addressReference"
							placeholder="Próximo ao shopping, em frente à igreja, etc."
							value={formData.addressReference}
							onChange={(e) =>
								setFormData({ ...formData, addressReference: e.target.value })
							}
						/>
					</div>
				</div>
			</div>
		</div>
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
					<p className="mt-2 text-sm text-muted-foreground">
						Carregando empresas...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
					<p className="text-muted-foreground">
						Gerencie clientes e fornecedores cadastrados no sistema
					</p>
				</div>
				<Dialog open={createDialog} onOpenChange={setCreateDialog}>
					<DialogTrigger asChild>
						<Button onClick={resetForm}>
							<Plus className="mr-2 h-4 w-4" />
							Nova Empresa
						</Button>
					</DialogTrigger>
					<DialogContent className="max-w-4xl">
						<DialogHeader>
							<DialogTitle>Cadastrar Nova Empresa</DialogTitle>
						</DialogHeader>
						<CompanyForm />
						<div className="flex justify-end gap-2 pt-4">
							<Button variant="outline" onClick={() => setCreateDialog(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreateCompany} disabled={actionLoading}>
								{actionLoading ? "Criando..." : "Criar Empresa"}
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Filtros</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
								<Input
									placeholder="Buscar por nome, razão social, CNPJ ou cidade..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-9"
								/>
							</div>
						</div>
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="w-full sm:w-[180px]">
								<SelectValue placeholder="Tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos os tipos</SelectItem>
								<SelectItem value="SUPPLIER">Fornecedores</SelectItem>
								<SelectItem value="CLIENT">Clientes</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Tabela */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Building2 className="h-5 w-5" />
						Empresas Cadastradas ({filteredCompanies.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Empresa</TableHead>
									<TableHead>Tipo</TableHead>
									<TableHead>CNPJ</TableHead>
									<TableHead>Responsável</TableHead>
									<TableHead>Localização</TableHead>
									<TableHead>Usuários</TableHead>
									<TableHead>Produtos</TableHead>
									<TableHead>Criado em</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredCompanies.map((company) => (
									<TableRow key={company.id}>
										<TableCell>
											<div>
												<div className="font-medium">{company.name}</div>
												{company.legalName && (
													<div className="text-sm text-muted-foreground">
														{company.legalName}
													</div>
												)}
												{company.email && (
													<div className="text-sm text-muted-foreground flex items-center gap-1">
														<Mail className="h-3 w-3" />
														{company.email}
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											<Badge className={getTypeBadgeColor(company.type)}>
												{getTypeLabel(company.type)}
											</Badge>
											{company.taxRegime && (
												<div className="text-xs text-muted-foreground mt-1">
													{getTaxRegimeLabel(company.taxRegime)}
												</div>
											)}
										</TableCell>
										<TableCell>
											{company.cnpj ? formatCNPJ(company.cnpj) : "-"}
										</TableCell>
										<TableCell>
											<div>
												{company.responsibleName && (
													<div className="font-medium text-sm">
														{company.responsibleName}
													</div>
												)}
												{company.responsibleEmail && (
													<div className="text-sm text-muted-foreground flex items-center gap-1">
														<Mail className="h-3 w-3" />
														{company.responsibleEmail}
													</div>
												)}
												{company.responsiblePhone && (
													<div className="text-sm text-muted-foreground flex items-center gap-1">
														<Phone className="h-3 w-3" />
														{formatPhone(company.responsiblePhone)}
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div>
												{company.city && company.state && (
													<div className="text-sm font-medium">
														{company.city}, {company.state}
													</div>
												)}
												{company.zipCode && (
													<div className="text-sm text-muted-foreground">
														CEP: {formatCEP(company.zipCode)}
													</div>
												)}
												{company.street && company.number && (
													<div className="text-sm text-muted-foreground">
														{company.addressType} {company.street},{" "}
														{company.number}
													</div>
												)}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1 text-sm">
												<Users className="h-4 w-4" />
												{company._count?.users || company.users?.length || 0}
											</div>
										</TableCell>
										<TableCell>
											<div className="flex items-center gap-1 text-sm">
												<Package className="h-4 w-4" />
												{company._count?.products ||
													company.products?.length ||
													0}
											</div>
										</TableCell>
										<TableCell>{formatDate(company.createdAt)}</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => openEditDialog(company)}
												>
													<Edit className="h-4 w-4" />
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleDeleteCompany(company.id)}
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
					{filteredCompanies.length === 0 && (
						<div className="text-center py-8">
							<Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
							<h3 className="mt-4 text-lg font-semibold">
								Nenhuma empresa encontrada
							</h3>
							<p className="mt-2 text-muted-foreground">
								{companies.length === 0
									? "Comece criando sua primeira empresa."
									: "Tente ajustar os filtros de busca."}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Dialog de Edição */}
			<Dialog open={editDialog} onOpenChange={setEditDialog}>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Editar Empresa</DialogTitle>
					</DialogHeader>
					<CompanyForm />
					<div className="flex justify-end gap-2 pt-4">
						<Button variant="outline" onClick={() => setEditDialog(false)}>
							Cancelar
						</Button>
						<Button onClick={handleUpdateCompany} disabled={actionLoading}>
							{actionLoading ? "Salvando..." : "Salvar Alterações"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
