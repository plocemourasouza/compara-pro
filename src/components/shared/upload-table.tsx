"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatters } from "@/lib/utils/masks";

export interface Upload {
	id: string;
	fileName: string;
	fileSize: number;
	uploadType: "SUPPLIER_PRODUCTS" | "CLIENT_REQUIREMENTS";
	status: "PROCESSING" | "COMPLETED" | "FAILED";
	isActive: boolean;
	priceChangeIndicator?: "UP" | "DOWN" | "SAME" | "FIRST_UPLOAD";
	totalRows: number;
	processedRows: number;
	errorRows: number;
	uploadedAt: string;
	processedAt?: string;
}

export interface UploadDetail extends Upload {
	products: Array<{
		id: string;
		sku?: string;
		code?: string;
		name: string;
		price?: number;
		category?: string;
		unit?: string;
	}>;
	errors?: Array<{ row: number; error: string }>;
}

export function getStatusLabel(status: string): string {
	switch (status) {
		case "COMPLETED":
			return "Concluído";
		case "PROCESSING":
			return "Processando";
		case "FAILED":
			return "Falhou";
		case "CANCELLED":
			return "Cancelado";
		default:
			return status;
	}
}

export function getStatusVariant(
	status: string,
): "default" | "secondary" | "destructive" {
	switch (status) {
		case "COMPLETED":
			return "default";
		case "FAILED":
			return "destructive";
		default:
			return "secondary";
	}
}

export function getUploadTypeLabel(type: string): string {
	return type === "SUPPLIER_PRODUCTS"
		? "Produtos do Fornecedor"
		: "Requisitos do Cliente";
}

export function getPriceChangeLabel(indicator?: string): string {
	switch (indicator) {
		case "UP":
			return "📈 Preços subiram";
		case "DOWN":
			return "📉 Preços baixaram";
		case "SAME":
			return "➡️ Preços mantidos";
		case "FIRST_UPLOAD":
			return "🆕 Primeiro upload";
		default:
			return "";
	}
}

export function formatFileSize(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes <= 0) return "—";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

interface ColumnOptions {
	showPriceIndicator?: boolean;
}

export function getUploadColumns({
	showPriceIndicator = false,
}: ColumnOptions = {}): ColumnDef<Upload>[] {
	const columns: ColumnDef<Upload>[] = [
		{
			accessorKey: "fileName",
			header: "Arquivo",
			cell: ({ row }) => (
				<div className="flex items-center gap-2">
					<span className="font-medium">{row.original.fileName}</span>
					{row.original.isActive && (
						<Badge variant="outline" className="text-xs">
							Ativo
						</Badge>
					)}
				</div>
			),
		},
		{
			accessorKey: "uploadType",
			header: "Tipo",
			enableSorting: false,
			cell: ({ row }) => getUploadTypeLabel(row.original.uploadType),
		},
		{
			accessorKey: "status",
			header: "Status",
			cell: ({ row }) => (
				<Badge variant={getStatusVariant(row.original.status)}>
					{getStatusLabel(row.original.status)}
				</Badge>
			),
		},
		{
			id: "rows",
			header: "Linhas",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="text-sm">
					<span>{row.original.totalRows} total</span>
					<span className="text-success">
						{" "}
						· {row.original.processedRows} ok
					</span>
					{row.original.errorRows > 0 && (
						<span className="text-destructive">
							{" "}
							· {row.original.errorRows} erro
						</span>
					)}
				</div>
			),
		},
	];

	if (showPriceIndicator) {
		columns.push({
			id: "priceIndicator",
			header: "Preço",
			enableSorting: false,
			cell: ({ row }) =>
				row.original.priceChangeIndicator ? (
					<Badge variant="outline" className="text-xs">
						{getPriceChangeLabel(row.original.priceChangeIndicator)}
					</Badge>
				) : (
					"-"
				),
		});
	}

	columns.push({
		accessorKey: "uploadedAt",
		header: "Upload em",
		cell: ({ row }) => formatters.datetime(row.original.uploadedAt),
	});

	return columns;
}
