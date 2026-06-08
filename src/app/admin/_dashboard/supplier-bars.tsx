"use client";

import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface SupplierBarsProps {
	data: Array<{
		supplierId: string;
		name: string;
		total: number;
		products: Array<{ name: string; value: number }>;
	}>;
}

const SLOTS = 10;

/** Cor por slot de rank do produto (p0 = produto #1 de cada fornecedor, etc.).
 * Consistente entre colunas: o mesmo rank tem a mesma cor. */
const SLOT_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
	"var(--primary)",
	"var(--success)",
	"var(--chart-2)",
	"var(--chart-4)",
	"var(--chart-1)",
];

const SLOT_DEFS = SLOT_COLORS.map((color, i) => ({
	key: `p${i}` as const,
	color,
}));

interface Row {
	supplier: string;
	total: number;
	names: string[];
	[slot: `p${number}`]: number;
}

function buildRows(data: SupplierBarsProps["data"]): Row[] {
	return data.map((s) => {
		const row: Row = { supplier: s.name, total: s.total, names: [] };
		for (let i = 0; i < SLOTS; i++) {
			const p = s.products[i];
			row[`p${i}`] = p?.value ?? 0;
			row.names.push(p?.name ?? "");
		}
		return row;
	});
}

/** Eixo Y compacto: 1500 → "1,5k". */
function compact(value: number): string {
	if (value >= 1000) return `${(value / 1000).toFixed(1).replace(".0", "")}k`;
	return String(value);
}

/** Props injetadas pelo recharts em runtime no componente de `content`. O tipo
 * oficial varia entre versões; tipamos só o que usamos. */
interface TooltipInjected {
	active?: boolean;
	payload?: Array<{ payload?: Row }>;
}

function SupplierTooltip({ active, payload }: TooltipInjected) {
	if (!active || !payload?.length) return null;
	const row = payload[0]?.payload;
	if (!row) return null;
	const items = row.names
		.map((name, i) => ({ name, value: row[`p${i}`] ?? 0 }))
		.filter((it) => it.value > 0);
	return (
		<div className="rounded-md border bg-popover p-2 text-xs shadow-md">
			<p className="font-semibold">{row.supplier}</p>
			<p className="mb-1 text-muted-foreground">{formatCurrency(row.total)}</p>
			<ul className="space-y-0.5">
				{items.map((it) => (
					<li key={it.name} className="flex justify-between gap-3">
						<span className="max-w-[160px] truncate">{it.name}</span>
						<span className="tabular-nums">{formatCurrency(it.value)}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export function SupplierBars({ data }: SupplierBarsProps) {
	if (data.length === 0) {
		return (
			<div className="flex h-[280px] items-center justify-center text-muted-foreground">
				Sem pré-pedidos.
			</div>
		);
	}
	const rows = buildRows(data);
	return (
		<ResponsiveContainer width="100%" height={280}>
			<BarChart
				data={rows}
				margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
				barCategoryGap="30%"
			>
				<CartesianGrid
					strokeDasharray="3 3"
					stroke="var(--border)"
					vertical={false}
				/>
				<XAxis
					dataKey="supplier"
					tick={{ fontSize: 11 }}
					interval={0}
					angle={-15}
					textAnchor="end"
					height={52}
				/>
				<YAxis
					tick={{ fontSize: 11 }}
					width={40}
					tickFormatter={(v) => compact(Number(v))}
				/>
				<Tooltip
					content={<SupplierTooltip />}
					cursor={{ fill: "var(--muted)", opacity: 0.3 }}
				/>
				{/* Render do menor rank (p9) ao maior (p0): a última Bar empilha no
				    topo, então o produto de maior relevância (p0) fica no topo. */}
				{[...SLOT_DEFS].reverse().map((slot) => (
					<Bar
						key={slot.key}
						dataKey={slot.key}
						stackId="s"
						fill={slot.color}
					/>
				))}
			</BarChart>
		</ResponsiveContainer>
	);
}
