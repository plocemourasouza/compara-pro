"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import type { DetailSection } from "@/components/shared/entity-detail-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatters } from "@/lib/utils/masks";

export interface Product {
	id: string;
	name: string;
	sku?: string;
	code?: string;
	price?: number;
	description?: string;
	category?: string;
	unit?: string;
	company: { id: string; name: string; type: string };
	createdAt: string;
	updatedAt: string;
}

function companyBadgeColor(type: string): string {
	return type === "SUPPLIER"
		? "bg-primary/10 text-primary"
		: "bg-success/10 text-success";
}

interface ColumnOptions {
	onDelete: (id: string) => void;
	showCompany?: boolean;
}

export function getProductColumns({
	onDelete,
	showCompany = false,
}: ColumnOptions): ColumnDef<Product>[] {
	const columns: ColumnDef<Product>[] = [
		{
			accessorKey: "name",
			header: "Nome",
			filterFn: (row, _id, value) => {
				const p = row.original;
				const q = String(value).toLowerCase();
				return [p.name, p.sku, p.code].some((f) =>
					f?.toLowerCase().includes(q),
				);
			},
			cell: ({ row }) => (
				<span className="font-medium">{row.original.name}</span>
			),
		},
		{
			id: "skuCode",
			header: "SKU/Código",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="space-y-1">
					{row.original.sku && (
						<div className="text-xs text-muted-foreground">
							SKU: {row.original.sku}
						</div>
					)}
					{row.original.code && (
						<div className="text-xs text-muted-foreground">
							Código: {row.original.code}
						</div>
					)}
					{!row.original.sku && !row.original.code && "-"}
				</div>
			),
		},
		{
			accessorKey: "price",
			header: "Preço",
			cell: ({ row }) =>
				row.original.price ? formatters.currency(row.original.price) : "-",
		},
		{
			accessorKey: "category",
			header: "Categoria",
			cell: ({ row }) => row.original.category || "-",
		},
	];

	if (showCompany) {
		columns.push({
			id: "company",
			header: "Empresa",
			enableSorting: false,
			cell: ({ row }) => (
				<Badge className={companyBadgeColor(row.original.company.type)}>
					{row.original.company.name}
				</Badge>
			),
		});
	}

	columns.push(
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
						aria-label="Excluir produto"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	);

	return columns;
}

export const productDetailSections: DetailSection<Product>[] = [
	{
		title: "Dados do Produto",
		fields: [
			{ label: "Nome", value: (p) => p.name },
			{ label: "SKU", value: (p) => p.sku },
			{ label: "Código", value: (p) => p.code },
			{
				label: "Preço",
				value: (p) => (p.price ? formatters.currency(p.price) : ""),
			},
			{ label: "Unidade", value: (p) => p.unit },
			{ label: "Categoria", value: (p) => p.category },
			{ label: "Descrição", value: (p) => p.description, full: true },
		],
	},
	{
		title: "Empresa",
		fields: [
			{ label: "Empresa", value: (p) => p.company.name },
			{
				label: "Tipo",
				value: (p) =>
					p.company.type === "SUPPLIER" ? "Fornecedor" : "Cliente",
			},
			{
				label: "Criado em",
				hideWhenEmpty: false,
				value: (p) => formatters.date(p.createdAt),
			},
		],
	},
];
