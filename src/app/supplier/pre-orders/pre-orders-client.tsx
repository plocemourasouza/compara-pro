"use client";

import { CheckCircle2, ClipboardList, Clock, XCircle } from "lucide-react";
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

type Bucket = { count: number; value: number };
type PreOrderStats = {
	total: Bucket;
	pending: Bucket;
	approved: Bucket;
	rejected: Bucket;
};

interface SupplierUser {
	id: string;
	name: string;
	email: string;
	area: string;
	company: { id: string; name: string; type: string } | null;
}

interface PreOrdersClientProps {
	user: SupplierUser;
}

export default function PreOrdersClient({ user }: PreOrdersClientProps) {
	const router = useRouter();
	const [orders, setOrders] = useState<PreOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("all");
	const [supplierFilter, setSupplierFilter] = useState("all");
	const [stats, setStats] = useState<PreOrderStats | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		void load();
	}, []);

	async function load() {
		setLoading(true);
		try {
			const res = await fetch("/api/pre-order/list?limit=50");
			const data = (await res.json()) as {
				preOrders?: PreOrder[];
				error?: string;
			};
			if (!res.ok) throw new Error(data.error ?? "Erro ao carregar");
			setOrders(data.preOrders ?? []);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Erro ao carregar");
		} finally {
			setLoading(false);
		}
		try {
			const res = await fetch("/api/pre-order/stats");
			if (res.ok) setStats((await res.json()) as PreOrderStats);
		} catch {
			// indicadores best-effort
		}
	}

	const columns = useMemo(() => getPreOrderColumns(), []);

	const supplierOptions = useMemo(() => {
		const map = new Map<string, string>();
		for (const o of orders) map.set(o.supplier.id, o.supplier.name);
		return [...map].map(([id, name]) => ({ id, name }));
	}, [orders]);

	const filteredOrders = useMemo(
		() =>
			orders.filter(
				(o) =>
					(statusFilter === "all" || o.status === statusFilter) &&
					(supplierFilter === "all" || o.supplier.id === supplierFilter),
			),
		[orders, statusFilter, supplierFilter],
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Pré-pedidos recebidos
				</h1>
				<p className="text-muted-foreground">
					Olá {user.name} — aprove ou rejeite os pré-pedidos dos compradores.
				</p>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					title="Total de pré-pedidos"
					icon={ClipboardList}
					value={stats ? stats.total.count.toLocaleString("pt-BR") : "—"}
					hint={stats ? formatters.currency(stats.total.value) : undefined}
				/>
				<StatCard
					title="Pendentes"
					icon={Clock}
					value={stats ? stats.pending.count.toLocaleString("pt-BR") : "—"}
					hint={stats ? formatters.currency(stats.pending.value) : undefined}
				/>
				<StatCard
					title="Aprovados"
					icon={CheckCircle2}
					iconClassName="text-success"
					value={stats ? stats.approved.count.toLocaleString("pt-BR") : "—"}
					hint={stats ? formatters.currency(stats.approved.value) : undefined}
				/>
				<StatCard
					title="Rejeitados"
					icon={XCircle}
					iconClassName="text-destructive"
					value={stats ? stats.rejected.count.toLocaleString("pt-BR") : "—"}
					hint={stats ? formatters.currency(stats.rejected.value) : undefined}
				/>
			</div>

			<Card className="flex min-h-0 flex-1 flex-col">
				<CardHeader>
					<CardTitle>Pré-pedidos</CardTitle>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col pt-6">
					<DataTable
						columns={columns}
						data={filteredOrders}
						searchKey="ref"
						searchPlaceholder="Buscar por cliente ou nº..."
						onRowClick={(order) =>
							router.push(`/supplier/pre-orders/${order.id}`)
						}
						isLoading={loading}
						emptyState="Nenhum pré-pedido recebido ainda."
						toolbar={
							<>
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
								{supplierOptions.length > 1 && (
									<Select
										value={supplierFilter}
										onValueChange={setSupplierFilter}
									>
										<SelectTrigger className="w-44">
											<SelectValue placeholder="Fornecedor" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Todos os fornecedores</SelectItem>
											{supplierOptions.map((s) => (
												<SelectItem key={s.id} value={s.id}>
													{s.name}
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
		</div>
	);
}
