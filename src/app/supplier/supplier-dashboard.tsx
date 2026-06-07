"use client";

import { motion } from "framer-motion";
import {
	ArrowUpRight,
	Building2,
	Package,
	ShoppingCart,
	Upload,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatters } from "@/lib/utils/masks";

interface DashboardMetrics {
	products: { active: number; total: number };
	activeCatalog: { fileName: string; uploadedAt: string } | null;
	preOrders: {
		pending: number;
		approved: number;
		rejected: number;
		totalValue: number;
	};
	uploads: { total: number; failed: number };
	clients: number;
	suppliers: number;
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

export default function SupplierDashboard({
	user,
}: {
	user: { name: string };
}) {
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/supplier/dashboard")
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.then((d) => setMetrics(d.metrics))
			.catch(() => setMetrics(null))
			.finally(() => setLoading(false));
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
			hint: metrics ? `${metrics.uploads.failed} uploads com erro` : "",
			icon: ArrowUpRight,
			href: "/supplier/pre-orders",
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Olá, {user.name}
					</h1>
					<p className="text-muted-foreground">
						Resumo do seu catálogo, carteira e pré-pedidos.
					</p>
				</div>
				<Button asChild>
					<Link href="/supplier/upload">
						<Upload className="mr-2 h-4 w-4" />
						Enviar catálogo
					</Link>
				</Button>
			</div>

			<motion.div
				className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
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
									Enviado em {formatters.date(metrics.activeCatalog.uploadedAt)}
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
