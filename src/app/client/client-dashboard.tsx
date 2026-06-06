"use client";

import {
	BarChart3,
	Building2,
	FileUp,
	PiggyBank,
	ShoppingCart,
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

export default function ClientDashboard({ user }: { user: { name: string } }) {
	const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/client/dashboard")
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.then((d) => setMetrics(d.metrics))
			.catch(() => setMetrics(null))
			.finally(() => setLoading(false));
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

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Olá, {user.name}
					</h1>
					<p className="text-muted-foreground">
						Suas demandas, comparações e pré-pedidos.
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
