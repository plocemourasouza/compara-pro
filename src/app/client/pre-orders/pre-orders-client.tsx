"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
				const data = (await response.json()) as {
					preOrders?: PreOrder[];
					pagination?: { total: number };
					error?: string;
				};
				if (!response.ok) {
					throw new Error(data.error ?? "Erro ao carregar pedidos");
				}
				const batch = data.preOrders ?? [];
				total = data.pagination?.total ?? collected.length + batch.length;
				collected.push(...batch);
				if (batch.length === 0) break;
				page += 1;
			} while (collected.length < total && page <= 100);
			setPreOrders(collected);
		} catch (error) {
			console.error("Fetch pre-orders error:", error);
			toast.error(
				error instanceof Error ? error.message : "Erro ao carregar pedidos",
			);
		} finally {
			setLoading(false);
		}
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
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Meus pedidos</h1>
				<p className="text-muted-foreground">
					Acompanhe os pedidos enviados aos fornecedores
				</p>
			</div>

			<Card className="flex min-h-0 flex-1 flex-col">
				<CardHeader>
					<CardTitle>Pedidos</CardTitle>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col pt-6">
					<DataTable
						columns={columns}
						data={filteredOrders}
						searchKey="ref"
						searchPlaceholder="Buscar por fornecedor ou nº..."
						onRowClick={(order) =>
							router.push(`/client/pre-orders/${order.id}`)
						}
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
