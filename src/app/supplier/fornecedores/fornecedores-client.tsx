"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { HintTooltip } from "@/components/shared/hint-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatters, masks } from "@/lib/utils/masks";
import {
	type SupplierCompanyValues,
	supplierCompanySchema,
} from "@/lib/validations/representative";

interface SupplierRow {
	id: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
	productCount: number;
	clientCount: number;
}

export default function FornecedoresClient() {
	const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [editing, setEditing] = useState<SupplierRow | null>(null);

	const form = useForm<SupplierCompanyValues>({
		resolver: zodResolver(supplierCompanySchema),
		defaultValues: { name: "", cnpj: "", city: "", state: "" },
	});

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

	const openCreate = () => {
		setEditing(null);
		form.reset({ name: "", cnpj: "", city: "", state: "" });
		setDialogOpen(true);
	};

	const openEdit = (s: SupplierRow) => {
		setEditing(s);
		form.reset({
			name: s.name,
			cnpj: s.cnpj ?? "",
			city: s.city ?? "",
			state: s.state ?? "",
		});
		setDialogOpen(true);
	};

	const onSubmit = async (values: SupplierCompanyValues) => {
		const url = editing
			? `/api/representative/suppliers/${editing.id}`
			: "/api/representative/suppliers";
		const res = await fetch(url, {
			method: editing ? "PUT" : "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(values),
		});
		const data = await res.json();
		if (!res.ok) {
			toast.error(data.error ?? "Erro ao salvar fornecedor");
			return;
		}
		toast.success(
			editing ? "Fornecedor atualizado." : "Fornecedor cadastrado.",
		);
		setDialogOpen(false);
		load();
	};

	const unlink = async (s: SupplierRow) => {
		if (
			!confirm(`Deixar de representar ${s.name}? Os produtos não são apagados.`)
		)
			return;
		const res = await fetch(`/api/representative/suppliers/${s.id}`, {
			method: "DELETE",
		});
		if (res.ok) {
			toast.success("Fornecedor desvinculado.");
			load();
		} else {
			toast.error("Não foi possível desvincular.");
		}
	};

	const columns: ColumnDef<SupplierRow>[] = [
		{
			accessorKey: "name",
			header: "Fornecedor",
			cell: ({ row }) => (
				<div>
					<p className="font-medium">{row.original.name}</p>
					{row.original.cnpj && (
						<p className="text-muted-foreground text-xs">
							{formatters.cnpj(row.original.cnpj)}
						</p>
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
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				// biome-ignore lint/a11y/noStaticElementInteractions: isolate row-action clicks
				<div
					className="flex justify-end gap-2"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					<HintTooltip
						label="Editar fornecedor"
						description="Atualize nome, CNPJ e localização da empresa."
					>
						<Button
							variant="outline"
							size="sm"
							onClick={() => openEdit(row.original)}
							aria-label="Editar fornecedor"
						>
							<Pencil className="h-4 w-4" />
						</Button>
					</HintTooltip>
					<HintTooltip
						label="Deixar de representar"
						description="Remove o vínculo. Os produtos e o catálogo do fornecedor não são apagados."
					>
						<Button
							variant="outline"
							size="sm"
							onClick={() => unlink(row.original)}
							aria-label="Desvincular fornecedor"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</HintTooltip>
				</div>
			),
		},
	];

	return (
		<div className="space-y-6">
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
				<Button onClick={openCreate}>
					<Plus className="mr-2 h-4 w-4" />
					Novo fornecedor
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Building2 className="h-5 w-5" />
						Fornecedores
					</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={suppliers}
						searchKey="name"
						searchPlaceholder="Buscar fornecedor..."
						isLoading={loading}
						emptyState="Você ainda não representa nenhum fornecedor. Cadastre o primeiro."
					/>
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editing ? "Editar fornecedor" : "Novo fornecedor"}
						</DialogTitle>
						<DialogDescription>
							{editing
								? "Atualize os dados da empresa fornecedora."
								: "Cadastre a empresa fornecedora que você representa."}
						</DialogDescription>
					</DialogHeader>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="grid grid-cols-1 gap-4 sm:grid-cols-6"
						>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem className="sm:col-span-4">
										<FormLabel>Nome do Fornecedor *</FormLabel>
										<FormControl>
											<Input placeholder="Nome fantasia" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="cnpj"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>CNPJ</FormLabel>
										<FormControl>
											<Input
												placeholder="00.000.000/0000-00"
												inputMode="numeric"
												{...field}
												onChange={(e) =>
													field.onChange(masks.cnpj(e.target.value))
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="city"
								render={({ field }) => (
									<FormItem className="sm:col-span-4">
										<FormLabel>Cidade</FormLabel>
										<FormControl>
											<Input placeholder="Cidade" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="state"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>UF</FormLabel>
										<FormControl>
											<Input
												placeholder="UF"
												maxLength={2}
												{...field}
												onChange={(e) =>
													field.onChange(e.target.value.toUpperCase())
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<DialogFooter className="sm:col-span-6">
								<Button
									type="button"
									variant="outline"
									onClick={() => setDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button type="submit" disabled={form.formState.isSubmitting}>
									{form.formState.isSubmitting ? "Salvando..." : "Salvar"}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
}
