"use client";

import { CheckCircle2, ClipboardList, Clock, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/stat-card";
import {
	getPreOrderColumns,
	type PreOrder,
} from "@/components/shared/pre-order-table";
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

interface PreOrdersClientProps {
	user: User;
}

export default function PreOrdersClient({ user: _user }: PreOrdersClientProps) {
	const router = useRouter();
	const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("all");

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchPreOrders();
	}, []);

	const fetchPreOrders = async () => {
		try {
			const pageSize = 50;
			const collected: PreOrder[] = [];
			let page = 1;
			let total = 0;
			do {
				const response = await fetch(
					`/api/pre-order/list?page=${page}&limit=${pageSize}`,
				);
				if (!response.ok) {
					toast.error("Erro ao carregar pedidos");
					return;
				}
				const data = await response.json();
				const batch: PreOrder[] = data.preOrders ?? [];
				total = data.pagination?.total ?? collected.length + batch.length;
				collected.push(...batch);
				if (batch.length === 0) break;
				page += 1;
			} while (collected.length < total && page <= 100);
			setPreOrders(collected);
		} catch (error) {
			console.error("Fetch pre-orders error:", error);
			toast.error("Erro ao carregar pedidos");
		} finally {
			setLoading(false);
		}
	};

	const columns = useMemo(
		() => getPreOrderColumns({ representative: true }),
		[],
	);

	const filteredOrders = useMemo(
		() =>
			statusFilter === "all"
				? preOrders
				: preOrders.filter((o) => o.status === statusFilter),
		[preOrders, statusFilter],
	);

	// Indicadores: totais globais (não reagem ao filtro de status)
	const stats = useMemo(
		() => ({
			total: preOrders.length,
			pending: preOrders.filter((o) => o.status === "ACTIVE").length,
			approved: preOrders.filter((o) => o.status === "FINALIZED").length,
			totalValue: preOrders.reduce((sum, o) => sum + (o.totalAmount ?? 0), 0),
		}),
		[preOrders],
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
				<p className="text-muted-foreground">
					Acompanhe todos os pedidos do sistema
				</p>
			</div>

			{/* Indicadores */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Total de Pedidos"
					icon={ClipboardList}
					value={stats.total}
				/>
				<StatCard title="Pendentes" icon={Clock} value={stats.pending} />
				<StatCard
					title="Aprovados"
					icon={CheckCircle2}
					iconClassName="text-success"
					value={stats.approved}
				/>
				<StatCard
					title="Valor total"
					icon={DollarSign}
					value={formatters.currency(stats.totalValue)}
				/>
			</div>

			<Card className="flex min-h-0 flex-1 flex-col">
				<CardHeader>
					<CardTitle>Pedidos</CardTitle>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col">
					<DataTable
						columns={columns}
						data={filteredOrders}
						searchKey="ref"
						searchPlaceholder="Buscar por cliente, representante ou nº..."
						onRowClick={(order) => router.push(`/admin/pre-orders/${order.id}`)}
						isLoading={loading}
						emptyState="Nenhum pedido encontrado."
						toolbar={
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-44">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos os status</SelectItem>
									<SelectItem value="ACTIVE">Pendente</SelectItem>
									<SelectItem value="FINALIZED">Aprovado</SelectItem>
									<SelectItem value="REJECTED">Rejeitado</SelectItem>
									<SelectItem value="EXPIRED">Expirado</SelectItem>
								</SelectContent>
							</Select>
						}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
