"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { formatters } from "@/lib/utils/masks";

interface UploadInfo {
	id: string;
	fileName: string;
	uploadType: "SUPPLIER_PRODUCTS" | "CLIENT_REQUIREMENTS";
	uploadedAt: string;
	totalRows: number;
	company?: { name: string } | null;
	uploadedBy?: { name: string } | null;
}

interface UploadItem {
	id: string;
	sku?: string | null;
	code?: string | null;
	name: string;
	price?: number | null;
	targetPrice?: number | null;
	category?: string | null;
	unit?: string | null;
	quantity?: number | null;
}

interface UploadItemsViewProps {
	uploadId: string;
	backHref: string;
}

export function UploadItemsView({ uploadId, backHref }: UploadItemsViewProps) {
	const router = useRouter();
	const [upload, setUpload] = useState<UploadInfo | null>(null);
	const [items, setItems] = useState<UploadItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError(null);
		fetch(`/api/upload/${uploadId}/items`)
			.then((res) =>
				res.ok ? res.json() : Promise.reject(new Error(String(res.status))),
			)
			.then((data) => {
				if (!active) return;
				setUpload(data.upload ?? null);
				setItems(data.items ?? []);
			})
			.catch(() => {
				if (active) setError("Lista não encontrada ou acesso negado.");
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [uploadId]);

	const isRequirements = upload?.uploadType === "CLIENT_REQUIREMENTS";

	const columns = useMemo<ColumnDef<UploadItem>[]>(() => {
		const base: ColumnDef<UploadItem>[] = [
			{
				id: "skuCode",
				header: "SKU/Código",
				enableSorting: false,
				cell: ({ row }) => (
					<span className="font-mono text-xs text-muted-foreground">
						{row.original.sku || row.original.code || "—"}
					</span>
				),
			},
			{
				accessorKey: "name",
				header: "Nome",
				cell: ({ row }) => (
					<span className="font-medium">{row.original.name}</span>
				),
			},
			{
				accessorKey: "price",
				header: "Preço",
				cell: ({ row }) =>
					row.original.price != null
						? formatters.currency(row.original.price)
						: "—",
			},
		];
		if (isRequirements) {
			base.push(
				{
					accessorKey: "targetPrice",
					header: "Preço alvo",
					cell: ({ row }) =>
						row.original.targetPrice != null
							? formatters.currency(row.original.targetPrice)
							: "—",
				},
				{
					accessorKey: "quantity",
					header: "Qtd",
					cell: ({ row }) => row.original.quantity ?? "—",
				},
			);
		}
		base.push(
			{
				accessorKey: "category",
				header: "Categoria",
				cell: ({ row }) => row.original.category || "—",
			},
			{
				accessorKey: "unit",
				header: "Unidade",
				cell: ({ row }) => row.original.unit || "—",
			},
		);
		return base;
	}, [isRequirements]);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.push(backHref)}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Itens da lista{upload ? ` — ${upload.fileName}` : ""}
					</h1>
					{upload && (
						<p className="text-muted-foreground">
							{upload.company?.name ?? ""} ·{" "}
							{formatters.datetime(upload.uploadedAt)}
							{upload.uploadedBy?.name ? ` · ${upload.uploadedBy.name}` : ""} ·{" "}
							{upload.totalRows} linha(s)
						</p>
					)}
				</div>
			</div>

			{loading ? (
				<div className="flex flex-1 items-center justify-center py-12">
					<Clock className="h-6 w-6 animate-spin text-primary" />
				</div>
			) : error ? (
				<Card>
					<CardContent className="py-12 text-center text-sm text-muted-foreground">
						{error}
					</CardContent>
				</Card>
			) : (
				<Card className="flex min-h-0 flex-1 flex-col">
					<CardHeader>
						<CardTitle>{items.length} item(ns)</CardTitle>
					</CardHeader>
					<CardContent className="flex min-h-0 flex-1 flex-col pt-6">
						<DataTable
							columns={columns}
							data={items}
							searchKey="name"
							searchPlaceholder="Buscar por nome..."
							emptyState="Nenhum item nesta lista."
						/>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
