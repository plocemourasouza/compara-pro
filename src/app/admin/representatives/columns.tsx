"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { FileSpreadsheet, ShoppingCart, Trash2 } from "lucide-react";
import { CnpjCell } from "@/components/shared/cnpj-cell";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatters } from "@/lib/utils/masks";
import type { Company } from "../companies/columns";

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
				return [c.name, c.legalName, c.cnpj].some((f) =>
					f?.toLowerCase().includes(q),
				);
			},
			cell: ({ row }) => (
				<div className="font-medium">{row.original.name}</div>
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
			id: "productLists",
			header: "Listas",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center gap-1 text-sm">
					<FileSpreadsheet className="h-4 w-4" />
					{row.original.productListCount ?? 0}
				</div>
			),
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
