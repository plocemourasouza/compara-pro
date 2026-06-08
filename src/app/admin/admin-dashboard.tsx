"use client";

import {
	AlertTriangle,
	CheckCircle,
	Percent,
	PiggyBank,
	ShoppingCart,
	Upload,
	UserCog,
	UserRound,
	Users,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPct } from "@/lib/format";
import { AttentionQueue } from "./_dashboard/attention-queue";
import { FunnelCard } from "./_dashboard/funnel-card";
import { LeaderboardCard } from "./_dashboard/leaderboard-card";
import { MatchingQualityCard } from "./_dashboard/matching-quality-card";
import { RoleDonut } from "./_dashboard/role-donut";
import { StatCard } from "./_dashboard/stat-card";
import { SupplierBars } from "./_dashboard/supplier-bars";
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
		todayByType: { representatives: number; clients: number };
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
	topSuppliers: Array<{
		supplierId: string;
		name: string;
		total: number;
		products: Array<{ name: string; value: number }>;
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
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
						title="Uploads Hoje"
						icon={Upload}
						value={
							<div className="grid grid-cols-3 gap-2">
								<div className="flex flex-col leading-none">
									<span>{metrics.uploads.today}</span>
									<span className="text-[11px] font-normal text-muted-foreground mt-1">
										Total
									</span>
								</div>
								<div className="flex flex-col leading-none">
									<span>{metrics.uploads.todayByType.representatives}</span>
									<span className="text-[11px] font-normal text-muted-foreground mt-1">
										Representantes
									</span>
								</div>
								<div className="flex flex-col leading-none">
									<span>{metrics.uploads.todayByType.clients}</span>
									<span className="text-[11px] font-normal text-muted-foreground mt-1">
										Clientes
									</span>
								</div>
							</div>
						}
						hint={
							<>
								<span>{metrics.uploads.thisMonth} este mês</span>
								<span className="flex items-center gap-1 ml-auto">
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

					{/* Funil + qualidade do matching + fila de atenção */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						<FunnelCard funnel={insights.funnel} />
						<MatchingQualityCard matching={insights.matching} />
						<AttentionQueue
							attention={insights.attention}
							activeLists={metrics?.uploads.activeLists ?? 0}
						/>
					</div>

					{/* Tendência */}
					<TrendChart trend={insights.trend} />

					{/* Rankings */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
					</div>
				</>
			)}

			{/* Distribuição por papel + top produtos (mantidos) */}
			{metrics && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<Card>
						<CardHeader>
							<CardTitle>Usuários por Papel</CardTitle>
						</CardHeader>
						<CardContent>
							<RoleDonut byRole={metrics.users.byRole} />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Top fornecedores</CardTitle>
							<CardDescription>
								Por valor em pré-pedidos — cada coluna empilha os 10 maiores
								produtos do fornecedor
							</CardDescription>
						</CardHeader>
						<CardContent>
							<SupplierBars data={metrics.topSuppliers} />
						</CardContent>
					</Card>
				</div>
			)}
		</div>
	);
}
