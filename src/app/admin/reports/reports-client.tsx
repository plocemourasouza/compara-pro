"use client";

import {
	Building2,
	Download,
	ShoppingCart,
	TrendingUp,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
	id: string;
	name: string;
	email: string;
	role: "ADMIN" | "SUPPLIER" | "CLIENT";
	company: { id: string; name: string; type: string } | null;
}

interface ReportsClientProps {
	user: User;
}

interface Metrics {
	users: {
		total: number;
		active: number;
		byRole: { admin: number; supplier: number; client: number };
	};
	companies: { total: number; suppliers: number; clients: number };
	uploads: { total: number };
	preOrders: {
		total: number;
		pending: number;
		approved: number;
		rejected: number;
		totalValue: number;
	};
	topProductsInPreOrders: {
		matchId: string | null;
		productName: string;
		totalValue: number;
		supplierCount: number;
	}[];
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
}

const COMPANY_COLORS = ["#9fbbe0", "#1f8a65"];
const PREORDER_COLORS = ["#c08532", "#1f8a65", "#d4574e"];

export function ReportsClient({ user: _user }: ReportsClientProps) {
	const [metrics, setMetrics] = useState<Metrics | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/admin/dashboard")
			.then((r) => (r.ok ? r.json() : Promise.reject(new Error("erro"))))
			.then((d: { metrics: Metrics }) => {
				setMetrics(d.metrics);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	const exportCsv = () => {
		if (!metrics) return;
		const rows: [string, string | number][] = [
			["Métrica", "Valor"],
			["Usuários (total)", metrics.users.total],
			["Usuários ativos", metrics.users.active],
			["Administradores", metrics.users.byRole.admin],
			["Usuários fornecedores", metrics.users.byRole.supplier],
			["Usuários clientes", metrics.users.byRole.client],
			["Empresas (total)", metrics.companies.total],
			["Empresas fornecedoras", metrics.companies.suppliers],
			["Empresas clientes", metrics.companies.clients],
			["Uploads (total)", metrics.uploads.total],
			["Pré-pedidos (total)", metrics.preOrders.total],
			["Pré-pedidos pendentes", metrics.preOrders.pending],
			["Pré-pedidos aprovados", metrics.preOrders.approved],
			["Pré-pedidos rejeitados", metrics.preOrders.rejected],
			["Valor total em pré-pedidos (R$)", metrics.preOrders.totalValue],
		];
		const csv = rows
			.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
			.join("\n");
		const blob = new Blob([`﻿${csv}`], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
		a.click();
		URL.revokeObjectURL(url);
	};

	const companyData = metrics
		? [
				{ name: "Clientes", value: metrics.companies.clients },
				{ name: "Fornecedores", value: metrics.companies.suppliers },
			]
		: [];
	const preOrderData = metrics
		? [
				{ name: "Pendentes", value: metrics.preOrders.pending },
				{ name: "Aprovados", value: metrics.preOrders.approved },
				{ name: "Rejeitados", value: metrics.preOrders.rejected },
			]
		: [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
					<p className="text-muted-foreground">Métricas reais do sistema</p>
				</div>
				<Button
					onClick={exportCsv}
					disabled={!metrics}
					className="flex items-center gap-2"
				>
					<Download className="h-4 w-4" />
					Exportar CSV
				</Button>
			</div>

			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
				</div>
			) : !metrics ? (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						Não foi possível carregar as métricas.
					</CardContent>
				</Card>
			) : (
				<>
					{/* Métricas reais */}
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Usuários
										</p>
										<p className="text-2xl font-bold">{metrics.users.total}</p>
										<p className="text-xs text-muted-foreground mt-1">
											{metrics.users.active} ativos
										</p>
									</div>
									<div className="p-2 bg-primary/10 rounded-full">
										<Users className="h-6 w-6 text-primary" />
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Empresas
										</p>
										<p className="text-2xl font-bold">
											{metrics.companies.total}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{metrics.companies.clients} clientes ·{" "}
											{metrics.companies.suppliers} fornec.
										</p>
									</div>
									<div className="p-2 bg-success/10 rounded-full">
										<Building2 className="h-6 w-6 text-success" />
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Pré-pedidos
										</p>
										<p className="text-2xl font-bold">
											{metrics.preOrders.total}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{metrics.preOrders.pending} pendentes ·{" "}
											{metrics.preOrders.approved} aprovados
										</p>
									</div>
									<div className="p-2 bg-chart-4/10 rounded-full">
										<ShoppingCart className="h-6 w-6 text-chart-4" />
									</div>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-muted-foreground">
											Valor em pré-pedidos
										</p>
										<p className="text-2xl font-bold">
											{formatCurrency(metrics.preOrders.totalValue)}
										</p>
									</div>
									<div className="p-2 bg-orange-100 rounded-full">
										<TrendingUp className="h-6 w-6 text-orange-600" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Distribuição de Empresas</CardTitle>
								<CardDescription>
									Clientes e fornecedores cadastrados
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={280}>
									<PieChart>
										<Pie
											data={companyData}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ name, value }) => `${name}: ${value}`}
											outerRadius={80}
											dataKey="value"
										>
											{companyData.map((entry, i) => (
												<Cell
													key={entry.name}
													fill={COMPANY_COLORS[i % COMPANY_COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Pré-pedidos por Status</CardTitle>
								<CardDescription>
									Situação atual dos pré-pedidos
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ResponsiveContainer width="100%" height={280}>
									<PieChart>
										<Pie
											data={preOrderData}
											cx="50%"
											cy="50%"
											labelLine={false}
											label={({ name, value }) => `${name}: ${value}`}
											outerRadius={80}
											dataKey="value"
										>
											{preOrderData.map((entry, i) => (
												<Cell
													key={entry.name}
													fill={PREORDER_COLORS[i % PREORDER_COLORS.length]}
												/>
											))}
										</Pie>
										<Tooltip />
										<Legend />
									</PieChart>
								</ResponsiveContainer>
							</CardContent>
						</Card>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Top produtos em pré-pedidos</CardTitle>
							<CardDescription>
								Produtos com maior valor acumulado
							</CardDescription>
						</CardHeader>
						<CardContent>
							{metrics.topProductsInPreOrders.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									Ainda não há pré-pedidos.
								</p>
							) : (
								<div className="space-y-3">
									{metrics.topProductsInPreOrders.map((p, index) => (
										<div
											key={p.matchId ?? `row-${index}`}
											className="flex items-center justify-between rounded-lg border p-3"
										>
											<div className="flex items-center gap-3">
												<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
													{index + 1}
												</div>
												<div>
													<p className="font-medium">{p.productName}</p>
													<p className="text-sm text-muted-foreground">
														{p.supplierCount} fornecedor(es)
													</p>
												</div>
											</div>
											<Badge variant="outline">
												{formatCurrency(p.totalValue)}
											</Badge>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
