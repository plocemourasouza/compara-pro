"use client";

import {
	AlertTriangle,
	CheckCircle,
	ClipboardList,
	Clock,
	DollarSign,
	Percent,
	PiggyBank,
	ShoppingCart,
	TrendingUp,
	Upload,
	UserCog,
	UserRound,
	Users,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPct } from "@/lib/format";
import { AttentionQueue } from "./_dashboard/attention-queue";
import { FunnelCard } from "./_dashboard/funnel-card";
import { LeaderboardCard } from "./_dashboard/leaderboard-card";
import { MatchingQualityCard } from "./_dashboard/matching-quality-card";
import { StatCard } from "./_dashboard/stat-card";
import { TrendChart } from "./_dashboard/trend-chart";
import type { Insights } from "./_dashboard/types";

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

interface RoleStat {
	total: number;
	active: number;
	inactive: number;
}

/** Linha de complemento "X ativos · Y inativos" reutilizada nos cards de papel. */
function activeInactiveHint(stat: RoleStat) {
	return (
		<>
			<span className="flex items-center gap-1">
				<CheckCircle className="h-3.5 w-3.5 text-success" />
				{stat.active} ativos
			</span>
			<span className="flex items-center gap-1">
				<XCircle className="h-3.5 w-3.5 text-destructive" />
				{stat.inactive} inativos
			</span>
		</>
	);
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
		roleBreakdown: {
			admin: RoleStat;
			supplier: RoleStat;
			client: RoleStat;
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
		activeLists: number;
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

const KPI_REFRESH_MS = 30_000;
const INSIGHTS_REFRESH_MS = 60_000;

export default function AdminDashboard({ user: _user }: AdminDashboardProps) {
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [insights, setInsights] = useState<Insights | null>(null);
	const [insightsLoading, setInsightsLoading] = useState(true);
	// null no SSR — evita hydration mismatch no relógio (preenchido no 1º fetch).
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

	useEffect(() => {
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

		const fetchInsights = async () => {
			try {
				const response = await fetch("/api/admin/dashboard/insights");
				if (response.ok) {
					const data = await response.json();
					setInsights(data.insights);
				}
			} catch (error) {
				console.error("Fetch insights error:", error);
			} finally {
				setInsightsLoading(false);
			}
		};

		fetchMetrics();
		fetchInsights();
		const kpiInterval = setInterval(fetchMetrics, KPI_REFRESH_MS);
		const insightsInterval = setInterval(fetchInsights, INSIGHTS_REFRESH_MS);
		return () => {
			clearInterval(kpiInterval);
			clearInterval(insightsInterval);
		};
	}, []);

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Dashboard Administrativo
					</h1>
					<p className="text-muted-foreground">
						Visão geral do sistema e métricas executivas
					</p>
				</div>
				<div className="text-right text-sm text-muted-foreground">
					<p>
						Última atualização:{" "}
						{lastUpdate ? lastUpdate.toLocaleTimeString("pt-BR") : "—"}
					</p>
				</div>
			</div>

			{/* Métricas principais (KPIs) */}
			{loading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
				</div>
			) : !metrics ? (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						<AlertTriangle className="h-8 w-8 mx-auto mb-2 text-destructive" />
						Não foi possível carregar as métricas do sistema.
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
					<StatCard
						title="Total de Usuários"
						icon={Users}
						value={metrics.users.total}
						hint={activeInactiveHint({
							total: metrics.users.total,
							active: metrics.users.active,
							inactive: metrics.users.inactive,
						})}
					/>
					<StatCard
						title="Representantes"
						icon={UserCog}
						value={metrics.users.roleBreakdown.supplier.total}
						hint={activeInactiveHint(metrics.users.roleBreakdown.supplier)}
					/>
					<StatCard
						title="Clientes"
						icon={UserRound}
						value={metrics.users.roleBreakdown.client.total}
						hint={activeInactiveHint(metrics.users.roleBreakdown.client)}
					/>
					<StatCard
						title="Listas ativas"
						icon={ClipboardList}
						iconClassName="text-primary"
						value={metrics.uploads.activeLists}
						hint={<span>catálogos de fornecedores</span>}
					/>
					<StatCard
						title="Uploads Hoje"
						icon={Upload}
						value={metrics.uploads.today}
						hint={
							<>
								<span>{metrics.uploads.thisMonth} este mês</span>
								<span className="flex items-center gap-1">
									<AlertTriangle className="h-3 w-3 text-destructive" />
									{metrics.uploads.byStatus.failed} falhas
									{(() => {
										const rate =
											metrics.uploads.total > 0
												? (metrics.uploads.byStatus.failed /
														metrics.uploads.total) *
													100
												: null;
										return rate === null
											? ""
											: ` (${Math.round(rate * 10) / 10}%)`;
									})()}
								</span>
							</>
						}
					/>
				</div>
			)}

			{/* KPIs de negócio (insights) */}
			{insightsLoading ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
				</div>
			) : !insights ? (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						Não foi possível carregar os insights.
					</CardContent>
				</Card>
			) : (
				<>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						<StatCard
							title="Pré-pedidos em aberto"
							icon={ShoppingCart}
							iconClassName="text-primary"
							value={metrics?.preOrders.pending ?? 0}
							hint={
								<span>{formatCurrency(insights.gmv.openValue)} em valor</span>
							}
						/>
						<StatCard
							title="Pré-pedidos finalizados"
							icon={CheckCircle}
							iconClassName="text-success"
							value={metrics?.preOrders.approved ?? 0}
							hint={
								<span>
									{formatCurrency(insights.gmv.finalizedValue)} em valor
								</span>
							}
						/>
						<StatCard
							title="Taxa de aprovação"
							icon={Percent}
							iconClassName="text-primary"
							value={formatPct(insights.gmv.approvalRatePct)}
						/>
						<StatCard
							title="Valor economizado"
							icon={PiggyBank}
							iconClassName="text-success"
							value={formatCurrency(insights.savings.finalizedSavings)}
							hint={
								<span>
									{insights.savings.itemsWithBaseline} itens finalizados
								</span>
							}
						/>
					</div>

					{/* Funil + fila de atenção */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<FunnelCard funnel={insights.funnel} />
						<AttentionQueue attention={insights.attention} />
					</div>

					{/* Tendência */}
					<TrendChart trend={insights.trend} />

					{/* Rankings + qualidade */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<LeaderboardCard
							title="Top representantes"
							description="Por valor de pré-pedidos finalizados"
							items={insights.leaderboards.topRepresentatives.map((r) => ({
								id: r.representativeId,
								name: r.name,
								value: r.finalizedValue,
							}))}
							valueFormatter={formatCurrency}
							emptyLabel="Nenhum pré-pedido finalizado."
						/>
						<LeaderboardCard
							title="Top clientes"
							description="Por gasto finalizado"
							items={insights.leaderboards.topClients.map((c) => ({
								id: c.companyId,
								name: c.name,
								value: c.spend,
							}))}
							valueFormatter={formatCurrency}
							emptyLabel="Nenhum pré-pedido finalizado."
						/>
						<MatchingQualityCard matching={insights.matching} />
					</div>
				</>
			)}

			{/* Distribuição por papel + top produtos (mantidos) */}
			{metrics && (
				<>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<Card>
							<CardHeader>
								<CardTitle>Usuários por Papel</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 bg-chart-4 rounded-full" />
											<span>Administradores</span>
										</div>
										<span className="font-semibold">
											{metrics.users.byRole.admin}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 bg-primary rounded-full" />
											<span>Representantes</span>
										</div>
										<span className="font-semibold">
											{metrics.users.byRole.supplier}
										</span>
									</div>
									<div className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<div className="w-3 h-3 bg-success rounded-full" />
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
																	? "bg-secondary"
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
								<div className="text-center p-4 bg-primary/10 rounded-lg">
									<Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
									<div className="text-2xl font-bold text-primary">
										{metrics.preOrders.pending}
									</div>
									<p className="text-sm text-primary">Pendentes</p>
								</div>

								<div className="text-center p-4 bg-success/10 rounded-lg">
									<CheckCircle className="h-6 w-6 mx-auto mb-2 text-success" />
									<div className="text-2xl font-bold text-success">
										{metrics.preOrders.approved}
									</div>
									<p className="text-sm text-success">Aprovados</p>
								</div>

								<div className="text-center p-4 bg-destructive/10 rounded-lg">
									<XCircle className="h-6 w-6 mx-auto mb-2 text-destructive" />
									<div className="text-2xl font-bold text-destructive">
										{metrics.preOrders.rejected}
									</div>
									<p className="text-sm text-destructive">Rejeitados</p>
								</div>

								<div className="text-center p-4 bg-chart-4/10 rounded-lg">
									<DollarSign className="h-6 w-6 mx-auto mb-2 text-chart-4" />
									<div className="text-lg font-bold text-chart-4">
										{metrics.preOrders.pending +
											metrics.preOrders.approved +
											metrics.preOrders.rejected}
									</div>
									<p className="text-sm text-chart-4">Total</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
