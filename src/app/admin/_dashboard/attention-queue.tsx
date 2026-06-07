import type { LucideIcon } from "lucide-react";
import { ChevronRight, Clock, Link2, ShoppingCart } from "lucide-react";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Insights } from "./types";

interface AttentionQueueProps {
	attention: Insights["attention"];
}

interface QueueRow {
	icon: LucideIcon;
	label: string;
	detail?: string;
	count: number;
	href: string;
	warn?: boolean;
}

export function AttentionQueue({ attention }: AttentionQueueProps) {
	const rows: QueueRow[] = [
		{
			icon: ShoppingCart,
			label: "Pré-pedidos aguardando resposta",
			count: attention.activePreOrders,
			href: "/admin/pre-orders",
		},
		{
			icon: Link2,
			label: "Solicitações de carteira pendentes",
			detail:
				attention.agingLinkRequests > 0
					? `${attention.agingLinkRequests} há mais de 7 dias`
					: undefined,
			count: attention.pendingLinkRequests,
			href: "/admin/companies",
			warn: attention.agingLinkRequests > 0,
		},
	];

	const allClear = rows.every((r) => r.count === 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="h-5 w-5" />
					Precisa de atenção
				</CardTitle>
				<CardDescription>Itens pendentes de ação</CardDescription>
			</CardHeader>
			<CardContent>
				{allClear ? (
					<div className="py-8 text-center text-muted-foreground">
						Tudo em dia. Nenhuma pendência.
					</div>
				) : (
					<div className="space-y-2">
						{rows.map((row) => (
							<Link
								key={row.label}
								href={row.href}
								className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
							>
								<div className="flex items-center gap-3">
									<div
										className={`flex h-9 w-9 items-center justify-center rounded-full ${
											row.warn ? "bg-destructive/10" : "bg-primary/10"
										}`}
									>
										<row.icon
											className={`h-4 w-4 ${
												row.warn ? "text-destructive" : "text-primary"
											}`}
										/>
									</div>
									<div>
										<p className="text-sm font-medium">{row.label}</p>
										{row.detail && (
											<p className="text-xs text-destructive">{row.detail}</p>
										)}
									</div>
								</div>
								<div className="flex items-center gap-2">
									<span className="text-lg font-bold tabular-nums">
										{row.count}
									</span>
									<ChevronRight className="h-4 w-4 text-muted-foreground" />
								</div>
							</Link>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
