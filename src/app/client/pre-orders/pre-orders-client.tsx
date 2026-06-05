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

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
	company: { id: string; name: string; type: string } | null;
};

interface PreOrdersClientProps {
	user: User;
}

export default function PreOrdersClient({ user: _user }: PreOrdersClientProps) {
	const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("all");
	const [selected, setSelected] = useState<PreOrder | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchPreOrders();
	}, []);

	const fetchPreOrders = async () => {
		try {
			const response = await fetch("/api/pre-order/list");
			if (response.ok) {
				const data = await response.json();
				setPreOrders(data.preOrders ?? []);
			} else {
				toast.error("Erro ao carregar pré-pedidos");
			}
		} catch (error) {
			console.error("Fetch pre-orders error:", error);
			toast.error("Erro ao carregar pré-pedidos");
		} finally {
			setLoading(false);
		}
	};

	const openDetail = (order: PreOrder) => {
		setSelected(order);
		setDetailOpen(true);
	};

	const columns = useMemo(() => getPreOrderColumns(), []);

	const filteredOrders = useMemo(
		() =>
			statusFilter === "all"
				? preOrders
				: preOrders.filter((o) => o.status === statusFilter),
		[preOrders, statusFilter],
	);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Meus pré-pedidos</h1>
				<p className="text-muted-foreground">
					Acompanhe os pré-pedidos enviados aos fornecedores
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
						searchPlaceholder="Buscar por fornecedor ou nº..."
						onRowClick={openDetail}
						isLoading={loading}
						emptyState="Nenhum pré-pedido encontrado."
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
			/>
		</div>
	);
}
