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
	representative?: { name: string } | null;
}

export interface PreOrderItem {
	id: string;
	name: string;
	sku?: string | null;
	code?: string | null;
	quantity: number;
	price: number;
	totalPrice: number;
	baselinePrice?: number | null;
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

export function getPreOrderColumns(opts?: {
	representative?: boolean;
}): ColumnDef<PreOrder>[] {
	const ref: ColumnDef<PreOrder> = {
		id: "ref",
		header: "Pré-pedido",
		accessorFn: (row) => row.id,
		filterFn: (row, _id, value) => {
			const o = row.original;
			const q = String(value).toLowerCase();
			return [
				o.id,
				o.client.name,
				o.supplier.name,
				o.representative?.name ?? "",
			].some((f) => f.toLowerCase().includes(q));
		},
		cell: ({ row }) => (
			<span className="font-medium">#{row.original.id.slice(-8)}</span>
		),
	};
	const client: ColumnDef<PreOrder> = {
		id: "client",
		header: "Cliente",
		enableSorting: false,
		cell: ({ row }) => row.original.client.name,
	};
	const supplier: ColumnDef<PreOrder> = {
		id: "supplier",
		header: "Fornecedor",
		enableSorting: false,
		cell: ({ row }) => row.original.supplier.name,
	};
	const representative: ColumnDef<PreOrder> = {
		id: "representative",
		header: "Representante",
		enableSorting: false,
		cell: ({ row }) => row.original.representative?.name ?? "—",
	};
	const items: ColumnDef<PreOrder> = {
		id: "items",
		header: opts?.representative ? "Qtd. Itens" : "Itens",
		enableSorting: false,
		cell: ({ row }) =>
			`${row.original.itemCount} item(ns) · ${row.original.totalQuantity} un`,
	};
	const amount: ColumnDef<PreOrder> = {
		accessorKey: "totalAmount",
		header: "Valor",
		cell: ({ row }) =>
			row.original.totalAmount
				? formatters.currency(row.original.totalAmount)
				: "-",
	};
	const status: ColumnDef<PreOrder> = {
		accessorKey: "status",
		header: "Status",
		cell: ({ row }) => (
			<Badge className={PRE_ORDER_STATUS[row.original.status].className}>
				{PRE_ORDER_STATUS[row.original.status].label}
			</Badge>
		),
	};
	const createdAt: ColumnDef<PreOrder> = {
		accessorKey: "createdAt",
		header: "Criado em",
		cell: ({ row }) => formatters.date(row.original.createdAt),
	};

	// Admin: Representante na frente, sem Fornecedor, Criado em antes de Status.
	if (opts?.representative) {
		return [representative, ref, client, items, amount, createdAt, status];
	}
	return [ref, client, supplier, items, amount, status, createdAt];
}
