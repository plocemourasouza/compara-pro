"use client";

import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import { Filter, Plus, Search, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EntityDetailModal } from "@/components/shared/entity-detail-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { getUsersColumns, type UserData } from "./columns";
import { userDetailSections } from "./detail-fields";

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
	company: { id: string; name: string; type: string } | null;
};

interface UsersClientProps {
	user: User;
}

interface UserFilters {
	search: string;
	role: string;
	status: string;
}

const INITIAL_FILTERS: UserFilters = {
	search: "",
	role: "all",
	status: "active",
};

const ITEMS_PER_PAGE = 10;

export default function UsersClient({ user: _user }: UsersClientProps) {
	const router = useRouter();
	const [users, setUsers] = useState<UserData[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [filters, setFilters] = useState<UserFilters>(INITIAL_FILTERS);
	const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: refetch on page/filters change
	useEffect(() => {
		fetchUsers();
	}, [page, filters]);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: page.toString(),
				limit: ITEMS_PER_PAGE.toString(),
				search: filters.search,
				role: filters.role,
				status: filters.status,
			});

			const response = await fetch(`/api/users?${params}`);
			if (!response.ok) {
				throw new Error("Erro ao carregar usuários");
			}

			const data = await response.json();
			setUsers(data.users || []);
			setTotalPages(data.pagination?.pages || 1);
			setTotal(data.pagination?.total || 0);
		} catch (error) {
			console.error("Erro ao carregar usuários:", error);
			toast.error("Não foi possível carregar os usuários");
		} finally {
			setLoading(false);
		}
	};

	const handleDeactivate = async (userId: string) => {
		setActionLoading(true);
		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: "DELETE",
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao desativar usuário");
			}
			toast.success("Usuário desativado com sucesso");
			await fetchUsers();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro de conexão");
		} finally {
			setActionLoading(false);
		}
	};

	const handleReactivate = async (userId: string) => {
		setActionLoading(true);
		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "reactivate" }),
			});
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao reativar usuário");
			}
			toast.success("Usuário reativado com sucesso");
			await fetchUsers();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro de conexão");
		} finally {
			setActionLoading(false);
		}
	};

	const updateFilters = (newFilters: Partial<UserFilters>) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
		setPage(1);
	};

	const openDetail = (userData: UserData) => {
		setSelectedUser(userData);
		setDetailOpen(true);
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: handlers are render-stable; only actionLoading affects columns
	const columns = useMemo(
		() =>
			getUsersColumns({
				onDeactivate: handleDeactivate,
				onReactivate: handleReactivate,
				actionLoading,
			}),
		[actionLoading],
	);

	const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
		const current: PaginationState = {
			pageIndex: page - 1,
			pageSize: ITEMS_PER_PAGE,
		};
		const next = typeof updater === "function" ? updater(current) : updater;
		setPage(next.pageIndex + 1);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Gestão de Usuários</h1>
					<p className="text-muted-foreground">
						Gerencie todos os usuários do sistema
					</p>
				</div>
				<Button onClick={() => router.push("/admin/users/novo")}>
					<Plus className="mr-2 h-4 w-4" />
					Novo Usuário
				</Button>
			</div>

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Filter className="h-5 w-5" />
							Filtros
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Users className="h-4 w-4" />
							{total} usuários
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="search">Buscar</Label>
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="search"
									placeholder="Nome ou email..."
									value={filters.search}
									onChange={(e) => updateFilters({ search: e.target.value })}
									className="pl-9"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="role-filter">Papel</Label>
							<Select
								value={filters.role}
								onValueChange={(value) => updateFilters({ role: value })}
							>
								<SelectTrigger id="role-filter">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos</SelectItem>
									<SelectItem value="ADMIN">Administrador</SelectItem>
									<SelectItem value="SUPPLIER">Fornecedor</SelectItem>
									<SelectItem value="CLIENT">Cliente</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="status-filter">Status</Label>
							<Select
								value={filters.status}
								onValueChange={(value) => updateFilters({ status: value })}
							>
								<SelectTrigger id="status-filter">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Ativos</SelectItem>
									<SelectItem value="inactive">Inativos</SelectItem>
									<SelectItem value="all">Todos</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Tabela */}
			<Card>
				<CardContent className="pt-6">
					<DataTable
						columns={columns}
						data={users}
						onRowClick={openDetail}
						isLoading={loading}
						emptyState="Nenhum usuário encontrado."
						manualPagination
						pageCount={totalPages}
						pagination={{ pageIndex: page - 1, pageSize: ITEMS_PER_PAGE }}
						onPaginationChange={handlePaginationChange}
					/>
				</CardContent>
			</Card>

			{/* Modal de Detalhes */}
			<EntityDetailModal
				open={detailOpen}
				onOpenChange={setDetailOpen}
				record={selectedUser}
				title="Detalhes do Usuário"
				sections={userDetailSections}
				editHref={(u) => `/admin/users/${u.id}/editar`}
			/>
		</div>
	);
}
