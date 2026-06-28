import { Filter } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatPct } from "@/lib/format";
import type { FunnelData } from "./types";

interface FunnelCardProps {
	funnel: FunnelData;
}

// Gradiente de progresso: chart-1 (entrada) → success (finalizado).
const STAGE_COLORS = [
	"var(--chart-1)",
	"var(--chart-5)",
	"var(--chart-3)",
	"var(--success)",
];

function conversion(curr: number, prev: number): number | null {
	if (prev <= 0) return null;
	return Math.round((curr / prev) * 1000) / 10;
}

export function FunnelCard({ funnel }: FunnelCardProps) {
	const stages = [
		{ label: "Listas de clientes enviadas", value: funnel.requirementUploads },
		{ label: "Comparações geradas", value: funnel.comparisons },
		{ label: "Pré-pedidos criados", value: funnel.preOrdersCreated },
		{ label: "Pré-pedidos finalizados", value: funnel.preOrdersFinalized },
	];
	const max = Math.max(...stages.map((s) => s.value), 1);
	const isEmpty = stages.every((s) => s.value === 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Filter className="h-5 w-5" />
					Funil de conversão
				</CardTitle>
				<CardDescription>
					Do upload do cliente ao pré-pedido finalizado
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isEmpty ? (
					<div className="py-8 text-center text-muted-foreground">
						Sem dados de funil ainda.
					</div>
				) : (
					<div className="space-y-5">
						{stages.map((stage, i) => {
							const prev = i === 0 ? null : stages[i - 1];
							const conv = prev ? conversion(stage.value, prev.value) : null;
							const widthPct = Math.max((stage.value / max) * 100, 2);
							return (
								<div key={stage.label}>
									<div className="flex items-center justify-between text-sm mb-1">
										<span className="text-muted-foreground">{stage.label}</span>
										<span className="font-semibold tabular-nums">
											{stage.value.toLocaleString("pt-BR")}
										</span>
									</div>
									<div className="h-3 w-full rounded-full bg-muted overflow-hidden">
										<div
											className="h-full rounded-full transition-all"
											style={{
												width: `${widthPct}%`,
												backgroundColor: STAGE_COLORS[i],
											}}
										/>
									</div>
									{conv !== null && (
										<p className="text-xs text-muted-foreground mt-1">
											{formatPct(conv)} do estágio anterior
										</p>
									)}
								</div>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
