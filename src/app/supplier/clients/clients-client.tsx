"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { formatters } from "@/lib/utils/masks";

interface ClientRow {
	linkId: string;
	id: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
	demandCount: number;
	lastDemandAt: string | null;
	addedAt: string;
}

const columns: ColumnDef<ClientRow>[] = [
	{
		accessorKey: "name",
		header: "Cliente",
		cell: ({ row }) => (
			<div>
				<p className="font-medium">{row.original.name}</p>
				{row.original.cnpj && (
					<p className="text-muted-foreground text-xs">
						{formatters.cnpj(row.original.cnpj)}
					</p>
				)}
			</div>
		),
	},
	{
		id: "local",
		header: "Local",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.city
				? `${row.original.city}${row.original.state ? `/${row.original.state}` : ""}`
				: "—",
	},
	{
		accessorKey: "demandCount",
		header: "Demandas",
		cell: ({ row }) => (
			<Badge variant={row.original.demandCount > 0 ? "default" : "secondary"}>
				{row.original.demandCount}
			</Badge>
		),
	},
	{
		accessorKey: "lastDemandAt",
		header: "Última demanda",
		cell: ({ row }) =>
			row.original.lastDemandAt
				? formatters.date(row.original.lastDemandAt)
				: "—",
	},
	{
		accessorKey: "addedAt",
		header: "Na carteira desde",
		cell: ({ row }) => formatters.date(row.original.addedAt),
	},
];

export default function ClientsClient() {
	const router = useRouter();
	const [clients, setClients] = useState<ClientRow[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/supplier/clients")
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.then((d) => setClients(d.clients))
			.catch(() => toast.error("Não foi possível carregar a carteira."))
			.finally(() => setLoading(false));
	}, []);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Carteira de Clientes
					</h1>
					<p className="text-muted-foreground">
						Seus clientes e as listas de demanda que eles enviam.
					</p>
				</div>
				<Button onClick={() => router.push("/supplier/clients/novo")}>
					<UserPlus className="mr-2 h-4 w-4" />
					Adicionar cliente
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Clientes</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={clients}
						searchKey="name"
						searchPlaceholder="Buscar cliente..."
						onRowClick={(c) => router.push(`/supplier/clients/${c.id}`)}
						isLoading={loading}
						emptyState="Nenhum cliente na carteira. Adicione o primeiro."
					/>
				</CardContent>
			</Card>
		</div>
	);
}
