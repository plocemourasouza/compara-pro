"use client";

import {
	BarChart3,
	Building2,
	CheckCircle,
	FileUp,
	Link2,
	Percent,
	PiggyBank,
	ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
	AttentionQueue,
	type QueueRow,
} from "@/components/dashboard/attention-queue";
import { FunnelCard } from "@/components/dashboard/funnel-card";
import { LeaderboardCard } from "@/components/dashboard/leaderboard-card";
import { MatchingQualityCard } from "@/components/dashboard/matching-quality-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import type { DashboardInsights } from "@/components/dashboard/types";
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
import { formatCurrency, formatPct } from "@/lib/format";
import { formatters } from "@/lib/utils/masks";

interface DashboardMetrics {
	demands: number;
	comparisons: number;
	preOrders: {
		pending: number;
		approved: number;
		rejected: number;
		totalValue: number;
	};
	estimatedSavings: number;
	suppliers: number;
	recentPreOrders: Array<{
		id: string;
		supplierName: string;
		status: string;
		totalAmount: number;
		createdAt: string;
	}>;
}

const PRE_ORDER_STATUS: Record<
	string,
	{ label: string; variant: "default" | "secondary" | "destructive" }
> = {
	ACTIVE: { label: "Pendente", variant: "secondary" },
	FINALIZED: { label: "Aprovado", variant: "default" },
	REJECTED: { label: "Rejeitado", variant: "destructive" },
	EXPIRED: { label: "Expirado", variant: "secondary" },
};

const KPI_REFRESH_MS = 30_000;
const INSIGHTS_REFRESH_MS = 60_000;

export default function ClientDashboard({ user }: { user: { name: string } }) {
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [insights, setInsights] = useState<DashboardInsights | null>(null);
	const [insightsLoading, setInsightsLoading] = useState(true);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

	useEffect(() => {
		const fetchMetrics = async () => {
			try {
				const r = await fetch("/api/client/dashboard");
				if (!r.ok) throw new Error();
				const d = await r.json();
				setMetrics(d.metrics);
				setLastUpdate(new Date());
			} catch {
				setMetrics(null);
			} finally {
				setLoading(false);
			}
		};
		fetchMetrics();
		const id = setInterval(fetchMetrics, KPI_REFRESH_MS);
		return () => clearInterval(id);
	}, []);

	useEffect(() => {
		const fetchInsights = async () => {
			try {
				const r = await fetch("/api/client/dashboard/insights");
				if (!r.ok) throw new Error();
				const d = await r.json();
				setInsights(d.insights);
			} catch {
				setInsights(null);
			} finally {
				setInsightsLoading(false);
			}
		};
		fetchInsights();
		const id = setInterval(fetchInsights, INSIGHTS_REFRESH_MS);
		return () => clearInterval(id);
	}, []);

	const cards = [
		{
			label: "Demandas enviadas",
			value: metrics ? `${metrics.demands}` : "—",
			hint: metrics ? `${metrics.comparisons} comparações` : "",
			icon: FileUp,
			href: "/client/upload",
		},
		{
			label: "Pré-pedidos pendentes",
			value: metrics ? `${metrics.preOrders.pending}` : "—",
			hint: metrics
				? `${metrics.preOrders.approved} aprovados · ${metrics.preOrders.rejected} rejeitados`
				: "",
			icon: ShoppingCart,
			href: "/client/pre-orders",
		},
		{
			label: "Fornecedores",
			value: metrics ? `${metrics.suppliers}` : "—",
			hint: "Minha carteira",
			icon: Building2,
			href: "/client/suppliers",
		},
		{
			label: "Economia estimada",
			value: metrics ? formatters.currency(metrics.estimatedSavings) : "—",
			hint: "Nas comparações",
			icon: PiggyBank,
			href: "/client/compare",
		},
	];

	const attentionRows: QueueRow[] = insights
		? [
				{
					icon: ShoppingCart,
					label: "Pré-pedidos aguardando resposta",
					count: insights.attention.activePreOrders,
					href: "/client/pre-orders",
				},
				{
					icon: BarChart3,
					label: "Comparações sem pré-pedido",
					subtitle: "Comparações geradas que ainda não viraram pedido",
					count: insights.attention.comparisonsNotConverted ?? 0,
					href: "/client/compare",
				},
				{
					icon: Link2,
					label: "Solicitações de fornecedor pendentes",
					count: insights.attention.pendingLinkRequests,
					href: "/client/suppliers",
				},
			]
		: [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Olá, {user.name}
					</h1>
					<p className="text-muted-foreground">
						Suas demandas, comparações e pré-pedidos.
						{lastUpdate &&
							` · Atualizado às ${lastUpdate.toLocaleTimeString("pt-BR")}`}
					</p>
				</div>
				<Button asChild>
					<Link href="/client/upload">
						<FileUp className="mr-2 h-4 w-4" />
						Enviar lista
					</Link>
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				{cards.map((c) => (
					<Link key={c.label} href={c.href}>
						<Card className="transition-colors hover:border-primary/50">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-muted-foreground text-sm">
									{c.label}
								</CardTitle>
								<c.icon className="h-4 w-4 text-muted-foreground" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{loading ? "…" : c.value}
								</div>
								{c.hint && (
									<p className="text-muted-foreground text-xs">{c.hint}</p>
								)}
							</CardContent>
						</Card>
					</Link>
				))}
			</div>

			{/* Insights KPIs — ênfase em economia */}
			{insightsLoading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{[0, 1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-28 w-full" />
					))}
				</div>
			) : insights ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<StatCard
						title="Economia finalizada"
						icon={PiggyBank}
						iconClassName="text-success"
						value={
							<span className="text-success">
								{formatCurrency(insights.savings.finalizedSavings)}
							</span>
						}
						hint={`${insights.savings.itemsWithBaseline} itens com preço-base`}
					/>
					<StatCard
						title="Economia estimada"
						icon={PiggyBank}
						value={formatCurrency(insights.savings.estimatedSavings ?? 0)}
						hint="Projetada nas comparações"
					/>
					<StatCard
						title="Valor finalizado"
						icon={CheckCircle}
						value={formatCurrency(insights.gmv.finalizedValue)}
						hint="Pré-pedidos aprovados"
					/>
					<StatCard
						title="Taxa de aprovação"
						icon={Percent}
						value={formatPct(insights.gmv.approvalRatePct)}
						hint="Finalizados / (finalizados + rejeitados)"
					/>
				</div>
			) : null}

			{/* Funil + Matching + Atenção */}
			{insights && (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					<FunnelCard funnel={insights.funnel} />
					<MatchingQualityCard matching={insights.matching} />
					<AttentionQueue rows={attentionRows} />
				</div>
			)}

			{/* Tendência */}
			{insights && <TrendChart trend={insights.trend} />}

			{/* Top fornecedores */}
			{insights && (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<LeaderboardCard
						title="Top fornecedores"
						description="Por gasto finalizado"
						items={insights.leaderboards.topSuppliers.map((s) => ({
							id: s.supplierId,
							name: s.name,
							value: s.finalizedValue,
						}))}
						valueFormatter={formatCurrency}
						emptyLabel="Nenhum pré-pedido finalizado."
					/>
				</div>
			)}

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="text-lg">Pré-pedidos recentes</CardTitle>
						<CardDescription>Últimos pedidos enviados.</CardDescription>
					</CardHeader>
					<CardContent>
						{loading ? (
							<p className="text-muted-foreground text-sm">Carregando…</p>
						) : !metrics || metrics.recentPreOrders.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								Nenhum pré-pedido ainda.
							</p>
						) : (
							<ul className="divide-y">
								{metrics.recentPreOrders.map((p) => {
									const s = PRE_ORDER_STATUS[p.status] ?? {
										label: p.status,
										variant: "secondary" as const,
									};
									return (
										<li
											key={p.id}
											className="flex items-center justify-between py-3"
										>
											<div>
												<p className="font-medium text-sm">{p.supplierName}</p>
												<p className="text-muted-foreground text-xs">
													{formatters.date(p.createdAt)}
												</p>
											</div>
											<div className="flex items-center gap-3">
												<span className="font-medium text-sm">
													{formatters.currency(p.totalAmount)}
												</span>
												<Badge variant={s.variant}>{s.label}</Badge>
											</div>
										</li>
									);
								})}
							</ul>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Comparar preços</CardTitle>
						<CardDescription>
							Case sua demanda com os fornecedores da carteira.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-muted-foreground text-sm">
							Envie uma lista de demanda e compare os melhores preços dos seus
							fornecedores.
						</p>
						<div className="flex flex-col gap-2">
							<Button asChild variant="outline" className="w-full">
								<Link href="/client/compare">
									<BarChart3 className="mr-2 h-4 w-4" />
									Comparar preços
								</Link>
							</Button>
							<Button asChild variant="ghost" className="w-full">
								<Link href="/client/suppliers">
									<Building2 className="mr-2 h-4 w-4" />
									Meus fornecedores
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
