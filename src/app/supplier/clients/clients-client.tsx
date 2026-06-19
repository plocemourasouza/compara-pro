"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Check, Clock, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CnpjCell } from "@/components/shared/cnpj-cell";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatters } from "@/lib/utils/masks";

interface PendingRequest {
	id: string;
	clientId: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
	requestedAt: string;
	supplierName: string;
}

interface ClientRow {
	id: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
	demandCount: number;
	lastDemandAt: string | null;
	addedAt: string;
	suppliers: { linkId: string; companyId: string; name: string }[];
}

const columns: ColumnDef<ClientRow>[] = [
	{
		accessorKey: "name",
		header: "Cliente",
		cell: ({ row }) => (
			<div>
				<p className="font-medium">{row.original.name}</p>
				{row.original.cnpj && (
					<CnpjCell
						masked={row.original.cnpj}
						companyId={row.original.id}
						className="text-muted-foreground text-xs"
					/>
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
		id: "suppliers",
		header: "Fornecedor(es)",
		enableSorting: false,
		cell: ({ row }) => (
			<div className="flex flex-wrap gap-1">
				{row.original.suppliers.map((s) => (
					<Badge
						key={s.companyId}
						className="bg-primary/10 text-primary text-xs"
					>
						{s.name}
					</Badge>
				))}
			</div>
		),
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
	const [stateFilter, setStateFilter] = useState("all");
	const [cityFilter, setCityFilter] = useState("all");

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

	const stateOptions = useMemo(
		() =>
			[
				...new Set(clients.map((c) => c.state).filter(Boolean)),
			].sort() as string[],
		[clients],
	);
	const cityOptions = useMemo(
		() =>
			[
				...new Set(
					clients
						.filter((c) => stateFilter === "all" || c.state === stateFilter)
						.map((c) => c.city)
						.filter(Boolean),
				),
			].sort() as string[],
		[clients, stateFilter],
	);
	const filtered = useMemo(
		() =>
			clients.filter(
				(c) =>
					(stateFilter === "all" || c.state === stateFilter) &&
					(cityFilter === "all" || c.city === cityFilter),
			),
		[clients, stateFilter, cityFilter],
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
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
											{r.cnpj || "Sem CNPJ"}
											{r.city ? ` · ${r.city}` : ""}
											{r.state ? `/${r.state}` : ""} ·{" "}
											{formatters.date(r.requestedAt)} · → {r.supplierName}
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

			<Card className="flex min-h-0 flex-1 flex-col">
				<CardHeader>
					<CardTitle>Clientes</CardTitle>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col pt-6">
					<DataTable
						columns={columns}
						data={filtered}
						searchKey="name"
						searchPlaceholder="Buscar cliente..."
						onRowClick={(c) => router.push(`/supplier/clients/${c.id}`)}
						isLoading={loading}
						emptyState="Nenhum cliente na carteira. Adicione o primeiro."
						toolbar={
							<div className="flex gap-2">
								<Select
									value={stateFilter}
									onValueChange={(v) => {
										setStateFilter(v);
										setCityFilter("all");
									}}
								>
									<SelectTrigger className="w-28">
										<SelectValue placeholder="UF" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todas UF</SelectItem>
										{stateOptions.map((uf) => (
											<SelectItem key={uf} value={uf}>
												{uf}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Select value={cityFilter} onValueChange={setCityFilter}>
									<SelectTrigger className="w-40">
										<SelectValue placeholder="Cidade" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todas cidades</SelectItem>
										{cityOptions.map((city) => (
											<SelectItem key={city} value={city}>
												{city}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
