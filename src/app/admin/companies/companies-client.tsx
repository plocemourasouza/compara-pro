"use client";

import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EntityDetailModal } from "@/components/shared/entity-detail-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { type Company, getCompaniesColumns } from "./columns";
import { companyDetailSections } from "./detail-fields";

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

interface CompaniesClientProps {
	user: UserType;
}

export default function CompaniesClient({ user: _user }: CompaniesClientProps) {
	const router = useRouter();
	const [companies, setCompanies] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [typeFilter, setTypeFilter] = useState<string>("all");
	const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

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

	const openDetail = (company: Company) => {
		setSelectedCompany(company);
		setDetailOpen(true);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: delete handler is render-stable; columns built once
	const columns = useMemo(
		() => getCompaniesColumns({ onDelete: handleDeleteCompany }),
		[],
	);

	const filteredCompanies = useMemo(
		() =>
			typeFilter === "all"
				? companies
				: companies.filter((c) => c.type === typeFilter),
		[companies, typeFilter],
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Empresas</h1>
					<p className="text-muted-foreground">
						Gerencie clientes e fornecedores cadastrados no sistema
					</p>
				</div>
				<Button onClick={() => router.push("/admin/companies/novo")}>
					<Plus className="mr-2 h-4 w-4" />
					Nova Empresa
				</Button>
			</div>

			{/* Tabela */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Building2 className="h-5 w-5" />
						Empresas Cadastradas ({filteredCompanies.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={filteredCompanies}
						searchKey="name"
						searchPlaceholder="Buscar por nome, razão social, CNPJ ou cidade..."
						onRowClick={openDetail}
						isLoading={loading}
						emptyState="Nenhuma empresa encontrada."
						toolbar={
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
						}
					/>
				</CardContent>
			</Card>

			{/* Modal de Detalhes */}
			<EntityDetailModal
				open={detailOpen}
				onOpenChange={setDetailOpen}
				record={selectedCompany}
				title="Detalhes da Empresa"
				sections={companyDetailSections}
				editHref={(company) => `/admin/companies/${company.id}/editar`}
			/>
		</div>
	);
}
