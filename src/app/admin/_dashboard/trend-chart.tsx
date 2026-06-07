"use client";

import {
	Area,
	AreaChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { Insights } from "./types";

interface TrendChartProps {
	trend: Insights["trend"];
}

const TREND_COLORS = { uploads: "var(--chart-3)", preOrders: "var(--primary)" };

/** "2026-06-07" → "07/06" para o eixo X. */
function shortDate(iso: string): string {
	const [, m, d] = iso.split("-");
	return `${d}/${m}`;
}

export function TrendChart({ trend }: TrendChartProps) {
	const isEmpty = trend.every((d) => d.uploads === 0 && d.preOrders === 0);
	const data = trend.map((d) => ({ ...d, label: shortDate(d.date) }));

	return (
		<Card>
			<CardHeader>
				<CardTitle>Atividade nos últimos 30 dias</CardTitle>
				<CardDescription>Uploads e pré-pedidos por dia</CardDescription>
			</CardHeader>
			<CardContent>
				{isEmpty ? (
					<div className="flex h-[280px] items-center justify-center text-muted-foreground">
						Sem atividade no período.
					</div>
				) : (
					<ResponsiveContainer width="100%" height={280}>
						<AreaChart
							data={data}
							margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
						>
							<defs>
								<linearGradient id="gradUploads" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor={TREND_COLORS.uploads}
										stopOpacity={0.4}
									/>
									<stop
										offset="95%"
										stopColor={TREND_COLORS.uploads}
										stopOpacity={0}
									/>
								</linearGradient>
								<linearGradient id="gradPreOrders" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="5%"
										stopColor={TREND_COLORS.preOrders}
										stopOpacity={0.4}
									/>
									<stop
										offset="95%"
										stopColor={TREND_COLORS.preOrders}
										stopOpacity={0}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
							<XAxis
								dataKey="label"
								tick={{ fontSize: 11 }}
								interval="preserveStartEnd"
								minTickGap={24}
							/>
							<YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
							<Tooltip />
							<Legend />
							<Area
								type="monotone"
								dataKey="uploads"
								name="Uploads"
								stroke={TREND_COLORS.uploads}
								fill="url(#gradUploads)"
								strokeWidth={2}
							/>
							<Area
								type="monotone"
								dataKey="preOrders"
								name="Pré-pedidos"
								stroke={TREND_COLORS.preOrders}
								fill="url(#gradPreOrders)"
								strokeWidth={2}
							/>
						</AreaChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}
