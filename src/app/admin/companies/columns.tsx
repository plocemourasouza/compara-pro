"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Package, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatters } from "@/lib/utils/masks";

export interface Company {
	id: string;
	name: string;
	legalName?: string;
	cnpj?: string;
	type: "SUPPLIER" | "CLIENT" | "REPRESENTATIVE";
	status?: "ACTIVE" | "BLOCKED" | "INACTIVE";
	taxRegime?: "MEI" | "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";
	email?: string;
	phone?: string;
	responsibleName?: string;
	responsibleEmail?: string;
	responsiblePhone?: string;
	addressType?: string;
	street?: string;
	number?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	zipCode?: string;
	addressReference?: string;
	users?: Array<{ id: string; name: string; email: string; role: string }>;
	products?: Array<{ id: string; name: string; sku?: string; code?: string }>;
	_count?: { users: number; products: number };
	preOrderCount?: number;
	createdAt: string;
	updatedAt: string;
}

export function getTypeLabel(type: string): string {
	switch (type) {
		case "SUPPLIER":
			return "Fornecedor";
		case "CLIENT":
			return "Cliente";
		case "REPRESENTATIVE":
			return "Representante";
		default:
			return type;
	}
}

export function getTypeBadgeColor(type: string): string {
	switch (type) {
		case "SUPPLIER":
			return "bg-primary/10 text-primary hover:bg-primary/20";
		case "CLIENT":
			return "bg-success/10 text-success hover:bg-success/20";
		case "REPRESENTATIVE":
			return "bg-accent text-accent-foreground hover:bg-accent/80";
		default:
			return "bg-muted text-muted-foreground hover:bg-secondary";
	}
}

const TAX_REGIME_LABELS: Record<string, string> = {
	MEI: "MEI",
	SIMPLES_NACIONAL: "Simples Nacional",
	LUCRO_PRESUMIDO: "Lucro Presumido",
	LUCRO_REAL: "Lucro Real",
};

export function getTaxRegimeLabel(regime: string): string {
	return TAX_REGIME_LABELS[regime] ?? regime;
}

interface ColumnActions {
	onDelete: (id: string) => void;
}

export function getCompaniesColumns({
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
			accessorKey: "type",
			header: "Tipo",
			cell: ({ row }) => (
				<div>
					<Badge className={getTypeBadgeColor(row.original.type)}>
						{getTypeLabel(row.original.type)}
					</Badge>
					{row.original.taxRegime && (
						<div className="mt-1 text-xs text-muted-foreground">
							{getTaxRegimeLabel(row.original.taxRegime)}
						</div>
					)}
				</div>
			),
		},
		{
			accessorKey: "cnpj",
			header: "CNPJ",
			cell: ({ row }) =>
				row.original.cnpj ? formatters.cnpj(row.original.cnpj) : "-",
		},
		{
			id: "responsible",
			header: "Responsável",
			enableSorting: false,
			cell: ({ row }) => row.original.responsibleName || "-",
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
			id: "products",
			header: "Produtos",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center gap-1 text-sm">
					<Package className="h-4 w-4" />
					{row.original._count?.products ?? row.original.products?.length ?? 0}
				</div>
			),
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
						aria-label="Excluir empresa"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			),
		},
	];
}
