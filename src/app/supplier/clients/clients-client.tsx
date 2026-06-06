"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Check, Clock, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { formatters } from "@/lib/utils/masks";

interface PendingRequest {
	id: string;
	clientId: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
	requestedAt: string;
}

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
	const [requests, setRequests] = useState<PendingRequest[]>([]);
	const [loading, setLoading] = useState(true);

	const load = useCallback(() => {
		setLoading(true);
		Promise.all([
			fetch("/api/supplier/clients").then((r) =>
				r.ok ? r.json() : { clients: [] },
			),
			fetch("/api/supplier/clients/requests").then((r) =>
				r.ok ? r.json() : { requests: [] },
			),
		])
			.then(([c, req]) => {
				setClients(c.clients);
				setRequests(req.requests);
			})
			.catch(() => toast.error("Não foi possível carregar a carteira."))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const respond = async (id: string, action: "APPROVE" | "REJECT") => {
		const res = await fetch(`/api/supplier/clients/requests/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ action }),
		});
		if (res.ok) {
			toast.success(
				action === "APPROVE" ? "Cliente aprovado." : "Solicitação recusada.",
			);
			load();
		} else {
			toast.error("Não foi possível responder.");
		}
	};

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

			{requests.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Clock className="h-5 w-5 text-amber-500" />
							Solicitações pendentes
						</CardTitle>
						<CardDescription>
							Clientes que pediram para entrar na sua carteira.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="divide-y">
							{requests.map((r) => (
								<li
									key={r.id}
									className="flex items-center justify-between gap-3 py-3"
								>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">{r.name}</p>
										<p className="text-muted-foreground text-xs">
											{r.cnpj ? formatters.cnpj(r.cnpj) : "Sem CNPJ"}
											{r.city ? ` · ${r.city}` : ""}
											{r.state ? `/${r.state}` : ""} ·{" "}
											{formatters.date(r.requestedAt)}
										</p>
									</div>
									<div className="flex shrink-0 gap-2">
										<Button size="sm" onClick={() => respond(r.id, "APPROVE")}>
											<Check className="mr-1 h-4 w-4" />
											Aprovar
										</Button>
										<Button
											size="sm"
											variant="outline"
											onClick={() => respond(r.id, "REJECT")}
										>
											<X className="mr-1 h-4 w-4" />
											Recusar
										</Button>
									</div>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

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
