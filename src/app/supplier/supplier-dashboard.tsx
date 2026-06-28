"use client";

import { motion } from "framer-motion";
import {
	ArrowUpRight,
	Building2,
	CheckCircle,
	ClipboardList,
	Link2,
	Package,
	Percent,
	PiggyBank,
	ShoppingCart,
	Upload,
	UserPlus,
	Users,
	Wallet,
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
import { SupplierBars } from "@/components/dashboard/supplier-bars";
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
	products: { active: number; total: number };
	activeCatalog: {
		fileName: string;
		uploadedAt: string;
		supplierName: string;
	} | null;
	preOrders: {
		pending: number;
		approved: number;
		rejected: number;
		totalValue: number;
	};
	uploads: { total: number; failed: number };
	clients: number;
	suppliers: number;
	pendingRequests: number;
	savings: number;
	recentPreOrders: Array<{
		id: string;
		clientName: string;
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

export default function SupplierDashboard({
	user,
}: {
	user: { name: string };
}) {
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
	const [loading, setLoading] = useState(true);
	const [insights, setInsights] = useState<DashboardInsights | null>(null);
	const [insightsLoading, setInsightsLoading] = useState(true);
	const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

	useEffect(() => {
		const fetchMetrics = async () => {
			try {
				const r = await fetch("/api/supplier/dashboard");
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
				const r = await fetch("/api/supplier/dashboard/insights");
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
			label: "Produtos ativos",
			value: metrics ? `${metrics.products.active}` : "—",
			hint: metrics ? `${metrics.products.total} no total` : "",
			icon: Package,
			href: "/supplier/products",
		},
		{
			label: "Pré-pedidos pendentes",
			value: metrics ? `${metrics.preOrders.pending}` : "—",
			hint: metrics
				? `${metrics.preOrders.approved} aprovados · ${metrics.preOrders.rejected} rejeitados`
				: "",
			icon: ShoppingCart,
			href: "/supplier/pre-orders",
		},
		{
			label: "Fornecedores",
			value: metrics ? `${metrics.suppliers}` : "—",
			hint: "Que você representa",
			icon: Building2,
			href: "/supplier/fornecedores",
		},
		{
			label: "Clientes na carteira",
			value: metrics ? `${metrics.clients}` : "—",
			hint: "Gerenciar carteira",
			icon: Users,
			href: "/supplier/clients",
		},
		{
			label: "Valor aprovado",
			value: metrics ? formatters.currency(metrics.preOrders.totalValue) : "—",
			hint: metrics
				? `${metrics.preOrders.approved} pré-pedidos aprovados`
				: "",
			icon: ArrowUpRight,
			href: "/supplier/pre-orders",
		},
		{
			label: "Economia gerada",
			value: metrics ? formatters.currency(metrics.savings) : "—",
			hint: "Em pré-pedidos aprovados",
			icon: Wallet,
			href: "/supplier/pre-orders",
		},
	];

	const attentionRows: QueueRow[] = insights
		? [
				{
					icon: ClipboardList,
					label: "Catálogos ativos",
					subtitle: `${insights.attention.listsBreakdown.suppliers} fornecedores · ${insights.attention.listsBreakdown.products} produtos · ${formatCurrency(insights.attention.listsBreakdown.totalValue)}`,
					count: insights.attention.listsBreakdown.suppliers,
					href: "/supplier/products",
				},
				{
					icon: ShoppingCart,
					label: "Pré-pedidos aguardando resposta",
					subtitle: `${insights.attention.preOrdersBreakdown.clients} clientes · ${insights.attention.preOrdersBreakdown.products} produtos · ${formatCurrency(insights.attention.preOrdersBreakdown.totalValue)}`,
					count: insights.attention.activePreOrders,
					href: "/supplier/pre-orders",
				},
				{
					icon: Link2,
					label: "Solicitações de carteira pendentes",
					detail:
						insights.attention.agingLinkRequests > 0
							? `${insights.attention.agingLinkRequests} aguardando há mais de 7 dias`
							: undefined,
					count: insights.attention.pendingLinkRequests,
					href: "/supplier/clients",
					warn: insights.attention.agingLinkRequests > 0,
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
						Resumo do seu catálogo, carteira e pré-pedidos.
						{lastUpdate &&
							` · Atualizado às ${lastUpdate.toLocaleTimeString("pt-BR")}`}
					</p>
				</div>
				<Button asChild>
					<Link href="/supplier/upload">
						<Upload className="mr-2 h-4 w-4" />
						Enviar catálogo
					</Link>
				</Button>
			</div>

			{metrics && metrics.pendingRequests > 0 && (
				<Link href="/supplier/clients">
					<Card className="border-primary/40 bg-primary/5 transition-colors hover:border-primary/60">
						<CardContent className="flex items-center gap-3 py-4">
							<UserPlus className="h-5 w-5 text-primary" />
							<div>
								<p className="font-medium text-sm">
									{metrics.pendingRequests}{" "}
									{metrics.pendingRequests === 1
										? "solicitação pendente"
										: "solicitações pendentes"}
								</p>
								<p className="text-muted-foreground text-xs">
									Clientes aguardando aprovação na carteira.
								</p>
							</div>
						</CardContent>
					</Card>
				</Link>
			)}

			<motion.div
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
				initial="hidden"
				animate="show"
				variants={{
					hidden: {},
					show: { transition: { staggerChildren: 0.06 } },
				}}
			>
				{cards.map((c) => (
					<motion.div
						key={c.label}
						variants={{
							hidden: { opacity: 0, y: 12 },
							show: { opacity: 1, y: 0 },
						}}
						whileHover={{ y: -4 }}
						whileTap={{ scale: 0.98 }}
						transition={{ type: "spring", stiffness: 300, damping: 24 }}
					>
						<Link href={c.href}>
							<Card className="transition-colors hover:border-primary/50 hover:shadow-sm">
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
					</motion.div>
				))}
			</motion.div>

			{/* Insights KPIs */}
			{insightsLoading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					{[0, 1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-28 w-full" />
					))}
				</div>
			) : insights ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
					<StatCard
						title="Pré-pedidos em aberto"
						icon={ShoppingCart}
						value={formatCurrency(insights.gmv.openValue)}
						hint={`${insights.attention.activePreOrders} aguardando resposta`}
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
					<StatCard
						title="Economia gerada"
						icon={PiggyBank}
						value={formatCurrency(insights.savings.finalizedSavings)}
						hint={`${insights.savings.itemsWithBaseline} itens com preço-base`}
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

			{/* Leaderboards */}
			{insights && (
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<LeaderboardCard
						title="Top fornecedores"
						description="Por valor de pré-pedidos finalizados"
						items={insights.leaderboards.topSuppliers.map((s) => ({
							id: s.supplierId,
							name: s.name,
							value: s.finalizedValue,
						}))}
						valueFormatter={formatCurrency}
						emptyLabel="Nenhum pré-pedido finalizado."
					/>
					<LeaderboardCard
						title="Top clientes"
						description="Por gasto finalizado na carteira"
						items={insights.leaderboards.topClients.map((c) => ({
							id: c.companyId,
							name: c.name,
							value: c.spend,
						}))}
						valueFormatter={formatCurrency}
						emptyLabel="Nenhum pré-pedido finalizado."
					/>
				</div>
			)}

			{/* Barras de fornecedor */}
			{insights && insights.supplierBars.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Top fornecedores por produto
						</CardTitle>
						<CardDescription>
							Valor finalizado, empilhado pelos principais produtos.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<SupplierBars data={insights.supplierBars} />
					</CardContent>
				</Card>
			)}

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="text-lg">Pré-pedidos recentes</CardTitle>
						<CardDescription>Últimos pedidos recebidos.</CardDescription>
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
												<p className="font-medium text-sm">{p.clientName}</p>
												<p className="text-muted-foreground text-xs">
													{p.supplierName} · {formatters.date(p.createdAt)}
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
						<CardTitle className="text-lg">Catálogo ativo</CardTitle>
						<CardDescription>Lista de preços vigente.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{loading ? (
							<p className="text-muted-foreground text-sm">Carregando…</p>
						) : metrics?.activeCatalog ? (
							<div>
								<p className="font-medium text-sm">
									{metrics.activeCatalog.fileName}
								</p>
								<p className="text-muted-foreground text-xs">
									{metrics.activeCatalog.supplierName} · enviado em{" "}
									{formatters.date(metrics.activeCatalog.uploadedAt)}
								</p>
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								Nenhum catálogo ativo. Envie sua lista de preços.
							</p>
						)}
						<Button asChild variant="outline" className="w-full">
							<Link href="/supplier/upload">
								<Upload className="mr-2 h-4 w-4" />
								Enviar catálogo
							</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
