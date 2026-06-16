"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ShoppingCart, Trash2, Users } from "lucide-react";
import { CnpjCell } from "@/components/shared/cnpj-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatters } from "@/lib/utils/masks";
import type { Company } from "../companies/columns";

const STATUS_LABELS: Record<string, string> = {
	ACTIVE: "Ativo",
	BLOCKED: "Bloqueado",
	INACTIVE: "Inativo",
};

function StatusBadge({ status }: { status?: Company["status"] }) {
	const value = status ?? "ACTIVE";
	if (value === "BLOCKED") {
		return (
			<Badge className="border-transparent bg-amber-500/10 text-amber-600">
				{STATUS_LABELS.BLOCKED}
			</Badge>
		);
	}
	if (value === "INACTIVE") {
		return <Badge variant="destructive">{STATUS_LABELS.INACTIVE}</Badge>;
	}
	return <Badge variant="secondary">{STATUS_LABELS.ACTIVE}</Badge>;
}

interface ColumnActions {
	onDelete: (id: string) => void;
}

/**
 * Colunas da lista de Representantes (agências). Difere de Empresas: sem Tipo e
 * sem Responsável; CNPJ anonimizado (LGPD) com cópia; e colunas Pré-pedidos e Status.
 */
export function getRepresentativesColumns({
	onDelete,
}: ColumnActions): ColumnDef<Company>[] {
	return [
		{
			accessorKey: "name",
			header: "Empresa",
			filterFn: (row, _id, value) => {
				const c = row.original;
				const q = String(value).toLowerCase();
				return [c.name, c.legalName, c.cnpj, c.city].some((f) =>
					f?.toLowerCase().includes(q),
				);
			},
			cell: ({ row }) => (
				<div>
					<div className="font-medium">{row.original.name}</div>
					{row.original.legalName && (
						<div className="text-sm text-muted-foreground">
							{row.original.legalName}
						</div>
					)}
				</div>
			),
		},
		{
			accessorKey: "cnpj",
			header: "CNPJ",
			enableSorting: false,
			cell: ({ row }) => (
				<CnpjCell masked={row.original.cnpj} companyId={row.original.id} />
			),
		},
		{
			id: "location",
			header: "Localização",
			enableSorting: false,
			cell: ({ row }) =>
				row.original.city && row.original.state
					? `${row.original.city}, ${row.original.state}`
					: "-",
		},
		{
			id: "preOrders",
			header: "Pré-pedidos",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center gap-1 text-sm">
					<ShoppingCart className="h-4 w-4" />
					{row.original.preOrderCount ?? 0}
				</div>
			),
		},
		{
			id: "users",
			header: "Usuários",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center gap-1 text-sm">
					<Users className="h-4 w-4" />
					{row.original._count?.users ?? row.original.users?.length ?? 0}
				</div>
			),
		},
		{
			id: "status",
			header: "Status",
			enableSorting: false,
			cell: ({ row }) => <StatusBadge status={row.original.status} />,
		},
		{
			accessorKey: "createdAt",
			header: "Criado em",
			cell: ({ row }) => formatters.date(row.original.createdAt),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				// biome-ignore lint/a11y/noStaticElementInteractions: click-isolation wrapper so the delete button doesn't open the detail modal
				<div
					className="flex justify-end"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onDelete(row.original.id)}
						aria-label="Excluir representante"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	];
}
