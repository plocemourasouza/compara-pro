import { AlertTriangle, Target } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatPct } from "@/lib/format";
import type { Insights } from "./types";

interface MatchingQualityCardProps {
	matching: Insights["matching"];
}

const TYPE_LABELS: Record<keyof Insights["matching"]["byType"], string> = {
	SKU: "SKU",
	CODE: "Código",
	NAME: "Nome",
	MANUAL: "Manual",
};
const TYPE_COLORS = [
	"var(--chart-1)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
];

export function MatchingQualityCard({ matching }: MatchingQualityCardProps) {
	const types = Object.entries(matching.byType) as Array<
		[keyof Insights["matching"]["byType"], number]
	>;
	const totalMatches = types.reduce((sum, [, n]) => sum + n, 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Target className="h-5 w-5" />
					Qualidade do matching
				</CardTitle>
				<CardDescription>
					Taxa de correspondência e tipos de match
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="flex items-end justify-between">
					<div>
						<div className="text-3xl font-bold">
							{formatPct(matching.matchRatePct)}
						</div>
						<p className="text-sm text-muted-foreground">
							{matching.matchedProducts.toLocaleString("pt-BR")} de{" "}
							{matching.totalProducts.toLocaleString("pt-BR")} itens
						</p>
					</div>
					{matching.lowConfidenceCount > 0 && (
						<div className="flex items-center gap-1 text-sm text-chart-5">
							<AlertTriangle className="h-4 w-4" />
							{matching.lowConfidenceCount} baixa confiança
						</div>
					)}
				</div>

				<div className="space-y-2">
					{types.map(([type, count], i) => {
						const widthPct =
							totalMatches > 0 ? (count / totalMatches) * 100 : 0;
						return (
							<div key={type}>
								<div className="flex items-center justify-between text-xs mb-1">
									<span className="text-muted-foreground">
										{TYPE_LABELS[type]}
									</span>
									<span className="font-medium tabular-nums">{count}</span>
								</div>
								<div className="h-2 w-full rounded-full bg-muted overflow-hidden">
									<div
										className="h-full rounded-full"
										style={{
											width: `${widthPct}%`,
											backgroundColor: TYPE_COLORS[i],
										}}
									/>
								</div>
							</div>
						);
					})}
				</div>
			</CardContent>
		</Card>
	);
}
