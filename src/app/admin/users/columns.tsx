"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Mail, RotateCcw, Trash2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface UserData {
	id: string;
	name: string;
	email: string;
	phone?: string | null;
	area: "ADMIN" | "REPRESENTATIVE" | "CLIENT";
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	pending: boolean;
	company: { id: string; name: string; type: string } | null;
}

export function getRoleLabel(role: string): string {
	const labels: Record<string, string> = {
		ADMIN: "Administrador",
		REPRESENTATIVE: "Representante",
		CLIENT: "Cliente",
	};
	return labels[role] ?? role;
}

export function getRoleBadgeColor(role: string): string {
	const colors: Record<string, string> = {
		ADMIN: "bg-chart-4/10 text-chart-4",
		REPRESENTATIVE: "bg-primary/10 text-primary",
		CLIENT: "bg-success/10 text-success",
	};
	return colors[role] ?? "bg-muted text-muted-foreground";
}

export function getUserInitials(name: string): string {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export function formatDateTime(dateString: string): string {
	return new Intl.DateTimeFormat("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(new Date(dateString));
}

interface ColumnActions {
	onDeactivate: (id: string) => void;
	onReactivate: (id: string) => void;
	onResend: (id: string) => void;
	actionLoading: boolean;
}

export function getUsersColumns({
	onDeactivate,
	onReactivate,
	onResend,
	actionLoading,
}: ColumnActions): ColumnDef<UserData>[] {
	return [
		{
			accessorKey: "name",
			header: "Usuário",
			enableSorting: false,
			cell: ({ row }) => (
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
						<span className="text-sm font-medium text-primary">
							{getUserInitials(row.original.name)}
						</span>
					</div>
					<span className="font-medium">{row.original.name}</span>
				</div>
			),
		},
		{
			accessorKey: "email",
			header: "Email",
			enableSorting: false,
		},
		{
			accessorKey: "area",
			header: "Papel",
			enableSorting: false,
			cell: ({ row }) => (
				<Badge className={getRoleBadgeColor(row.original.area)}>
					{getRoleLabel(row.original.area)}
				</Badge>
			),
		},
		{
			id: "company",
			header: "Empresa",
			enableSorting: false,
			cell: ({ row }) => row.original.company?.name ?? "-",
		},
		{
			id: "status",
			header: "Status",
			enableSorting: false,
			cell: ({ row }) => {
				if (row.original.deletedAt) {
					return <Badge variant="destructive">Inativo</Badge>;
				}
				if (row.original.pending) {
					return (
						<Badge className="border-transparent bg-amber-500/10 text-amber-600">
							Pendente
						</Badge>
					);
				}
				return <Badge variant="secondary">Ativo</Badge>;
			},
		},
		{
			accessorKey: "createdAt",
			header: "Criado em",
			enableSorting: false,
			cell: ({ row }) => formatDateTime(row.original.createdAt),
		},
		{
			id: "actions",
			header: "",
			enableSorting: false,
			cell: ({ row }) => (
				// biome-ignore lint/a11y/noStaticElementInteractions: click-isolation wrapper so action buttons don't open the detail modal
				<div
					className="flex justify-end gap-2"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
				>
					{!row.original.deletedAt && row.original.pending && (
						<Button
							variant="outline"
							size="sm"
							aria-label="Reenviar código"
							title="Reenviar código de primeiro acesso"
							disabled={actionLoading}
							onClick={() => onResend(row.original.id)}
						>
							<Mail className="h-4 w-4" />
						</Button>
					)}
					{row.original.deletedAt ? (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="text-success"
									aria-label="Reativar usuário"
								>
									<RotateCcw className="h-4 w-4" />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Reativar Usuário</AlertDialogTitle>
									<AlertDialogDescription>
										Tem certeza que deseja reativar o usuário{" "}
										{row.original.name}?
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancelar</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => onReactivate(row.original.id)}
										className="bg-success hover:bg-success/90"
										disabled={actionLoading}
									>
										{actionLoading ? "Reativando..." : "Reativar"}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					) : (
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button
									variant="outline"
									size="sm"
									className="text-destructive"
									aria-label="Desativar usuário"
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>Desativar Usuário</AlertDialogTitle>
									<AlertDialogDescription>
										Tem certeza que deseja desativar o usuário{" "}
										{row.original.name}? Esta ação pode ser revertida
										posteriormente.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancelar</AlertDialogCancel>
									<AlertDialogAction
										onClick={() => onDeactivate(row.original.id)}
										className="bg-destructive hover:bg-destructive/90"
										disabled={actionLoading}
									>
										{actionLoading ? "Desativando..." : "Desativar"}
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					)}
				</div>
			),
		},
	];
}
