"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PreOrderDetailModal } from "@/components/shared/pre-order-detail-modal";
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

interface SupplierUser {
	id: string;
	name: string;
	email: string;
	role: string;
	company: { id: string; name: string; type: string } | null;
}

interface PreOrdersClientProps {
	user: SupplierUser;
}

export default function PreOrdersClient({ user }: PreOrdersClientProps) {
	const [orders, setOrders] = useState<PreOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [statusFilter, setStatusFilter] = useState("all");
	const [selected, setSelected] = useState<PreOrder | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

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
	}

	async function respond(
		id: string,
		action: "APPROVE" | "REJECT",
		notes?: string,
	) {
		setBusy(true);
		try {
			const res = await fetch("/api/pre-order/bulk-action", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ preOrderIds: [id], action, notes }),
			});
			const data = (await res.json()) as { message?: string; error?: string };
			if (!res.ok) throw new Error(data.error ?? "Erro");
			toast.success(data.message ?? "Pré-pedido atualizado");
			setDetailOpen(false);
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Erro");
		} finally {
			setBusy(false);
		}
	}

	const openDetail = (order: PreOrder) => {
		setSelected(order);
		setDetailOpen(true);
	};

	const columns = useMemo(() => getPreOrderColumns(), []);

	const filteredOrders = useMemo(
		() =>
			statusFilter === "all"
				? orders
				: orders.filter((o) => o.status === statusFilter),
		[orders, statusFilter],
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Pré-pedidos recebidos
				</h1>
				<p className="text-muted-foreground">
					Olá {user.name} — aprove ou rejeite os pré-pedidos dos compradores.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Pré-pedidos</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={filteredOrders}
						searchKey="ref"
						searchPlaceholder="Buscar por cliente ou nº..."
						onRowClick={openDetail}
						isLoading={loading}
						emptyState="Nenhum pré-pedido recebido ainda."
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

			<PreOrderDetailModal
				open={detailOpen}
				onOpenChange={setDetailOpen}
				preOrder={selected}
				canRespond
				busy={busy}
				onApprove={(id) => respond(id, "APPROVE")}
				onReject={(id, notes) => respond(id, "REJECT", notes)}
			/>
		</div>
	);
}
