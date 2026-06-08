"use client";

import type { OnChangeFn, PaginationState } from "@tanstack/react-table";
import {
	Plus,
	Search,
	ShieldCheck,
	UserCog,
	UserRound,
	Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { EntityDetailModal } from "@/components/shared/entity-detail-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { StatCard } from "../_dashboard/stat-card";
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

interface UserStats {
	total: number;
	active: number;
	inactive: number;
	admins: number;
	representatives: number;
	clients: number;
}

const INITIAL_STATS: UserStats = {
	total: 0,
	active: 0,
	inactive: 0,
	admins: 0,
	representatives: 0,
	clients: 0,
};

const ITEMS_PER_PAGE = 10;

export default function UsersClient({ user: _user }: UsersClientProps) {
	const router = useRouter();
	const [users, setUsers] = useState<UserData[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
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
			setStats(data.stats ?? INITIAL_STATS);
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

	const handleResend = async (userId: string) => {
		setActionLoading(true);
		try {
			const response = await fetch(`/api/users/${userId}/resend-activation`, {
				method: "POST",
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Erro ao reenviar código");
			}
			toast.success("Código reenviado", {
				description: data.activation?.code
					? `Novo código: ${data.activation.code} — envie ao usuário.`
					: undefined,
				duration: 20000,
			});
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
				onResend: handleResend,
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
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Gestão de Usuários
					</h1>
					<p className="text-muted-foreground">
						Gerencie todos os usuários do sistema
					</p>
				</div>
				<Button onClick={() => router.push("/admin/users/novo")}>
					<Plus className="mr-2 h-4 w-4" />
					Novo Usuário
				</Button>
			</div>

			{/* Indicadores */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Total de Usuários"
					icon={Users}
					value={stats.total}
					hint={`${stats.active} ativos · ${stats.inactive} inativos`}
				/>
				<StatCard
					title="Administradores"
					icon={ShieldCheck}
					value={stats.admins}
				/>
				<StatCard
					title="Representantes"
					icon={UserCog}
					value={stats.representatives}
				/>
				<StatCard title="Clientes" icon={UserRound} value={stats.clients} />
			</div>

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
						toolbar={
							<>
								<div className="relative w-full sm:w-md">
									<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										placeholder="Nome ou email..."
										value={filters.search}
										onChange={(e) => updateFilters({ search: e.target.value })}
										className="pl-9"
										aria-label="Buscar usuários"
									/>
								</div>
								<Select
									value={filters.role}
									onValueChange={(value) => updateFilters({ role: value })}
								>
									<SelectTrigger className="w-full sm:w-44" aria-label="Papel">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos os papéis</SelectItem>
										<SelectItem value="ADMIN">Administrador</SelectItem>
										<SelectItem value="REPRESENTATIVE">
											Representante
										</SelectItem>
										<SelectItem value="CLIENT">Cliente</SelectItem>
									</SelectContent>
								</Select>
								<Select
									value={filters.status}
									onValueChange={(value) => updateFilters({ status: value })}
								>
									<SelectTrigger className="w-full sm:w-36" aria-label="Status">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">Ativos</SelectItem>
										<SelectItem value="inactive">Inativos</SelectItem>
										<SelectItem value="all">Todos</SelectItem>
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
				record={selectedUser}
				title="Detalhes do Usuário"
				sections={userDetailSections}
				editHref={(u) => `/admin/users/${u.id}/editar`}
			/>
		</div>
	);
}
