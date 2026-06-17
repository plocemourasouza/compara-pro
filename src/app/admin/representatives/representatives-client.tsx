"use client";

import { Handshake, Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	CompanyFilterControls,
	useCompanyFilters,
} from "@/components/shared/company-filters";
import { EntityDetailModal } from "@/components/shared/entity-detail-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { StatCard } from "../_dashboard/stat-card";
import type { Company } from "../companies/columns";
import { getRepresentativesColumns } from "./columns";
import { representativeDetailSections } from "./detail-fields";

interface UserType {
	id: string;
	name: string;
	email: string;
	area: string;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
}

interface RepresentativesClientProps {
	user: UserType;
}

export default function RepresentativesClient({
	user: _user,
}: RepresentativesClientProps) {
	const router = useRouter();
	const [representatives, setRepresentatives] = useState<Company[]>([]);
	const [loading, setLoading] = useState(true);
	const [selected, setSelected] = useState<Company | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchRepresentatives();
	}, []);

	const fetchRepresentatives = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/companies?type=REPRESENTATIVE");

			if (response.ok) {
				const data = await response.json();
				setRepresentatives(data.companies ?? []);
			} else {
				toast.error("Erro ao carregar representantes");
			}
		} catch (error) {
			console.error("Error fetching representatives:", error);
			toast.error("Erro ao carregar representantes");
		} finally {
			setLoading(false);
		}
	};

	const handleDelete = async (companyId: string) => {
		if (!confirm("Tem certeza que deseja excluir este representante?")) {
			return;
		}

		try {
			const response = await fetch(`/api/companies/${companyId}`, {
				method: "DELETE",
			});

			if (response.ok) {
				toast.success("Representante excluído com sucesso!");
				fetchRepresentatives();
			} else {
				const data = await response.json();
				toast.error(data.error || "Erro ao excluir representante");
			}
		} catch (error) {
			console.error("Error deleting representative:", error);
			toast.error("Erro ao excluir representante");
		}
	};

	const openDetail = (company: Company) => {
		setSelected(company);
		setDetailOpen(true);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: delete handler is render-stable; columns built once
	const columns = useMemo(
		() => getRepresentativesColumns({ onDelete: handleDelete }),
		[],
	);

	const filters = useCompanyFilters(representatives);
	const filteredReps = useMemo(
		() => representatives.filter(filters.predicate),
		[representatives, filters.predicate],
	);

	const stats = useMemo(
		() => ({
			total: representatives.length,
			users: representatives.reduce(
				(sum, c) => sum + (c._count?.users ?? 0),
				0,
			),
		}),
		[representatives],
	);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Representantes</h1>
					<p className="text-muted-foreground">
						Gerencie as agências representantes cadastradas no sistema
					</p>
				</div>
				<Button onClick={() => router.push("/admin/representatives/novo")}>
					<Plus className="mr-2 h-4 w-4" />
					Novo Representante
				</Button>
			</div>

			{/* Indicadores */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<StatCard
					title="Total de Representantes"
					icon={Handshake}
					value={stats.total}
				/>
				<StatCard
					title="Usuários vinculados"
					icon={Users}
					value={stats.users}
				/>
			</div>

			{/* Tabela */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Handshake className="h-5 w-5" />
						Representantes Cadastrados ({filteredReps.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={filteredReps}
						searchKey="name"
						searchPlaceholder="Buscar por CNPJ ou nome..."
						onRowClick={openDetail}
						isLoading={loading}
						emptyState="Nenhum representante encontrado."
						toolbar={<CompanyFilterControls {...filters} />}
					/>
				</CardContent>
			</Card>

			{/* Modal de Detalhes */}
			<EntityDetailModal
				open={detailOpen}
				onOpenChange={setDetailOpen}
				record={selected}
				title="Detalhes do Representante"
				sections={representativeDetailSections}
				editHref={(company) => `/admin/representatives/${company.id}/editar`}
			/>
		</div>
	);
}
