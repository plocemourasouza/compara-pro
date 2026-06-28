import type { LucideIcon } from "lucide-react";
import { ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export interface QueueRow {
	icon: LucideIcon;
	label: string;
	subtitle?: string;
	detail?: string;
	count: number;
	href: string;
	warn?: boolean;
}

interface AttentionQueueProps {
	rows: QueueRow[];
	title?: string;
	description?: string;
	allClearLabel?: string;
}

/** Fila de atenção 100% apresentacional. Cada dashboard monta `rows` com seus
 * próprios hrefs e textos — sem acoplamento a área. */
export function AttentionQueue({
	rows,
	title = "Precisa de atenção",
	description = "Itens pendentes de ação",
	allClearLabel = "Tudo em dia. Nenhuma pendência.",
}: AttentionQueueProps) {
	const allClear = rows.every((r) => r.count === 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="h-5 w-5" />
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				{allClear ? (
					<div className="py-8 text-center text-muted-foreground">
						{allClearLabel}
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
										{row.subtitle && (
											<p className="text-xs text-muted-foreground">
												{row.subtitle}
											</p>
										)}
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
