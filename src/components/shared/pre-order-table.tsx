"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatters } from "@/lib/utils/masks";

export type PreOrderStatus = "ACTIVE" | "FINALIZED" | "REJECTED" | "EXPIRED";

export interface PreOrder {
	id: string;
	status: PreOrderStatus;
	totalAmount?: number;
	itemCount: number;
	totalQuantity: number;
	createdAt: string;
	respondedAt?: string | null;
	notes?: string;
	client: { id: string; name: string };
	supplier: { id: string; name: string };
}

export const PRE_ORDER_STATUS: Record<
	PreOrderStatus,
	{ label: string; className: string }
> = {
	ACTIVE: { label: "Pendente", className: "bg-primary/10 text-primary" },
	FINALIZED: { label: "Aprovado", className: "bg-success/10 text-success" },
	REJECTED: {
		label: "Rejeitado",
		className: "bg-destructive/10 text-destructive",
	},
	EXPIRED: { label: "Expirado", className: "bg-muted text-muted-foreground" },
};

export function getPreOrderColumns(): ColumnDef<PreOrder>[] {
	return [
		{
			id: "ref",
			header: "Pré-pedido",
			accessorFn: (row) => row.id,
			filterFn: (row, _id, value) => {
				const o = row.original;
				const q = String(value).toLowerCase();
				return [o.id, o.client.name, o.supplier.name].some((f) =>
					f.toLowerCase().includes(q),
				);
			},
			cell: ({ row }) => (
				<span className="font-medium">#{row.original.id.slice(-8)}</span>
			),
		},
		{
			id: "client",
			header: "Cliente",
			enableSorting: false,
			cell: ({ row }) => row.original.client.name,
		},
		{
			id: "supplier",
			header: "Fornecedor",
			enableSorting: false,
			cell: ({ row }) => row.original.supplier.name,
		},
		{
			id: "items",
			header: "Itens",
			enableSorting: false,
			cell: ({ row }) =>
				`${row.original.itemCount} item(ns) · ${row.original.totalQuantity} un`,
		},
		{
			accessorKey: "totalAmount",
			header: "Valor",
			cell: ({ row }) =>
				row.original.totalAmount
					? formatters.currency(row.original.totalAmount)
					: "-",
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<Badge className={PRE_ORDER_STATUS[row.original.status].className}>
					{PRE_ORDER_STATUS[row.original.status].label}
				</Badge>
			),
		},
		{
			accessorKey: "createdAt",
			header: "Criado em",
			cell: ({ row }) => formatters.date(row.original.createdAt),
		},
	];
}
