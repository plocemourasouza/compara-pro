"use client";

import {
	AlertTriangle,
	Building2,
	CheckCircle,
	Clock,
	DollarSign,
	RefreshCw,
	ShoppingCart,
	TrendingUp,
	Upload,
	Users,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
};

interface AdminDashboardProps {
	user: User;
}

interface DashboardMetrics {
	users: {
		total: number;
		active: number;
		inactive: number;
		byRole: {
			admin: number;
			supplier: number;
			client: number;
		};
	};
	companies: {
		total: number;
		suppliers: number;
		clients: number;
	};
	uploads: {
		total: number;
		today: number;
		thisWeek: number;
		thisMonth: number;
		byStatus: {
			success: number;
			processing: number;
			failed: number;
		};
	};
	preOrders: {
		total: number;
		pending: number;
		approved: number;
		rejected: number;
		totalValue: number;
	};
	topProductsInPreOrders: Array<{
		matchId: string;
		productName: string;
		totalValue: number;
		supplierCount: number;
	}>;
}

export default function AdminDashboard({ user: _user }: AdminDashboardProps) {
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch + interval
	useEffect(() => {
		fetchMetrics();
		// Auto-refresh every 30 seconds
		const interval = setInterval(fetchMetrics, 30000);
		return () => clearInterval(interval);
	}, []);

	const fetchMetrics = async () => {
		try {
			const response = await fetch("/api/admin/dashboard");
			if (response.ok) {
				const data = await response.json();
				setMetrics(data.metrics);
				setLastUpdate(new Date());
			}
		} catch (error) {
			console.error("Fetch metrics error:", error);
		} finally {
			setLoading(false);
		}
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	const _formatBytes = (bytes: number) => {
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
		if (bytes === 0) return "0 Bytes";
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${Math.round((bytes / 1024 ** i) * 100) / 100} ${sizes[i]}`;
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
					<p>Carregando métricas...</p>
				</div>
			</div>
		);
	}

	if (!metrics) {
		return (
			<div className="text-center p-8">
				<AlertTriangle className="h-8 w-8 mx-auto mb-2 text-red-500" />
				<p>Erro ao carregar métricas do sistema</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Dashboard Administrativo</h1>
					<p className="text-muted-foreground">
						Visão geral do sistema e métricas executivas
					</p>
				</div>
				<div className="text-right text-sm text-muted-foreground">
					<p>Última atualização: {lastUpdate.toLocaleTimeString("pt-BR")}</p>
				</div>
			</div>

			{/* Métricas de Usuários */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total de Usuários
						</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.users.total}</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
							<span className="flex items-center gap-1">
								<CheckCircle className="h-3 w-3 text-green-500" />
								{metrics.users.active} ativos
							</span>
							<span className="flex items-center gap-1">
								<XCircle className="h-3 w-3 text-red-500" />
								{metrics.users.inactive} inativos
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Empresas</CardTitle>
						<Building2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.companies.total}</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
							<span>{metrics.companies.suppliers} fornecedores</span>
							<span>{metrics.companies.clients} clientes</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Uploads Hoje</CardTitle>
						<Upload className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.uploads.today}</div>
						<p className="text-xs text-muted-foreground">
							{metrics.uploads.thisMonth} este mês
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Pré-pedidos</CardTitle>
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{metrics.preOrders.total}</div>
						<p className="text-xs text-muted-foreground">
							{formatCurrency(metrics.preOrders.totalValue)} em valor
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Distribuição por Papel */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>Usuários por Papel</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-purple-500 rounded-full" />
									<span>Administradores</span>
								</div>
								<span className="font-semibold">
									{metrics.users.byRole.admin}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-blue-500 rounded-full" />
									<span>Fornecedores</span>
								</div>
								<span className="font-semibold">
									{metrics.users.byRole.supplier}
								</span>
							</div>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<div className="w-3 h-3 bg-green-500 rounded-full" />
									<span>Clientes</span>
								</div>
								<span className="font-semibold">
									{metrics.users.byRole.client}
								</span>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Top 3 Produtos em Pré-pedidos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{metrics.topProductsInPreOrders.length > 0 ? (
								metrics.topProductsInPreOrders.map((product, index) => (
									<div
										key={product.matchId}
										className="flex items-center justify-between"
									>
										<div className="flex items-center gap-2">
											<div
												className={`w-2 h-2 rounded-full ${
													index === 0
														? "bg-yellow-500"
														: index === 1
															? "bg-gray-400"
															: "bg-orange-500"
												}`}
											/>
											<div className="flex flex-col">
												<span className="text-sm font-medium truncate max-w-[200px]">
													{product.productName}
												</span>
												<span className="text-xs text-muted-foreground">
													{product.supplierCount} fornecedor
													{product.supplierCount !== 1 ? "es" : ""}
												</span>
											</div>
										</div>
										<span className="font-semibold text-sm">
											{formatCurrency(product.totalValue)}
										</span>
									</div>
								))
							) : (
								<div className="text-center text-muted-foreground py-4">
									Nenhum produto em pré-pedidos
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Estatísticas de Pré-pedidos */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<TrendingUp className="h-5 w-5" />
						Estatísticas de Pré-pedidos
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="text-center p-4 bg-blue-50 rounded-lg">
							<Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
							<div className="text-2xl font-bold text-blue-600">
								{metrics.preOrders.pending}
							</div>
							<p className="text-sm text-blue-600">Pendentes</p>
						</div>

						<div className="text-center p-4 bg-green-50 rounded-lg">
							<CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
							<div className="text-2xl font-bold text-green-600">
								{metrics.preOrders.approved}
							</div>
							<p className="text-sm text-green-600">Aprovados</p>
						</div>

						<div className="text-center p-4 bg-red-50 rounded-lg">
							<XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
							<div className="text-2xl font-bold text-red-600">
								{metrics.preOrders.rejected}
							</div>
							<p className="text-sm text-red-600">Rejeitados</p>
						</div>

						<div className="text-center p-4 bg-purple-50 rounded-lg">
							<DollarSign className="h-6 w-6 mx-auto mb-2 text-purple-600" />
							<div className="text-lg font-bold text-purple-600">
								{metrics.preOrders.pending +
									metrics.preOrders.approved +
									metrics.preOrders.rejected}
							</div>
							<p className="text-sm text-purple-600">Total</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
