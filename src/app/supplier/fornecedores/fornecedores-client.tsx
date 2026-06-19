"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CnpjCell } from "@/components/shared/cnpj-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface SupplierRow {
	id: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
	productCount: number;
	clientCount: number;
	lastCatalogAt: string | null;
}

export default function FornecedoresClient() {
	const router = useRouter();
	const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [stateFilter, setStateFilter] = useState("all");
	const [cityFilter, setCityFilter] = useState("all");

	const load = useCallback(() => {
		setLoading(true);
		fetch("/api/representative/suppliers")
			.then((r) => (r.ok ? r.json() : { suppliers: [] }))
			.then((d) => setSuppliers(d.suppliers ?? []))
			.catch(() => toast.error("Não foi possível carregar os fornecedores."))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const stateOptions = useMemo(
		() =>
			[
				...new Set(suppliers.map((s) => s.state).filter(Boolean)),
			].sort() as string[],
		[suppliers],
	);
	const cityOptions = useMemo(
		() =>
			[
				...new Set(
					suppliers
						.filter((s) => stateFilter === "all" || s.state === stateFilter)
						.map((s) => s.city)
						.filter(Boolean),
				),
			].sort() as string[],
		[suppliers, stateFilter],
	);

	const filtered = useMemo(
		() =>
			suppliers.filter(
				(s) =>
					(stateFilter === "all" || s.state === stateFilter) &&
					(cityFilter === "all" || s.city === cityFilter),
			),
		[suppliers, stateFilter, cityFilter],
	);

	const columns: ColumnDef<SupplierRow>[] = [
		{
			accessorKey: "name",
			header: "Fornecedor",
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
			id: "catalog",
			header: "Catálogo",
			enableSorting: false,
			cell: ({ row }) =>
				row.original.lastCatalogAt ? (
					<Badge variant="secondary">
						{formatters.date(row.original.lastCatalogAt)}
					</Badge>
				) : (
					<Badge variant="outline" className="text-muted-foreground">
						Sem catálogo
					</Badge>
				),
		},
		{
			accessorKey: "productCount",
			header: "Produtos",
			cell: ({ row }) => (
				<Badge variant="secondary">{row.original.productCount}</Badge>
			),
		},
		{
			accessorKey: "clientCount",
			header: "Clientes",
			cell: ({ row }) => (
				<Badge variant="secondary">{row.original.clientCount}</Badge>
			),
		},
	];

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Fornecedores Representados
					</h1>
					<p className="text-muted-foreground">
						As empresas fornecedoras que você representa. Cada lista de preços é
						enviada em nome de um deles.
					</p>
				</div>
				<Button onClick={() => router.push("/supplier/fornecedores/novo")}>
					<Plus className="mr-2 h-4 w-4" />
					Novo fornecedor
				</Button>
			</div>

			<Card className="flex min-h-0 flex-1 flex-col">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Building2 className="h-5 w-5" />
						Fornecedores
					</CardTitle>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col pt-6">
					<DataTable
						columns={columns}
						data={filtered}
						searchKey="name"
						searchPlaceholder="Buscar fornecedor..."
						isLoading={loading}
						emptyState="Você ainda não representa nenhum fornecedor. Cadastre o primeiro."
						onRowClick={(s) => router.push(`/supplier/fornecedores/${s.id}`)}
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
