"use client";

import {
	Cell,
	Label,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

interface RoleDonutProps {
	byRole: { admin: number; supplier: number; client: number };
}

const SLICES = [
	{ key: "supplier", name: "Representantes", color: "var(--primary)" },
	{ key: "client", name: "Clientes", color: "var(--success)" },
	{ key: "admin", name: "Administradores", color: "var(--chart-4)" },
] as const;

export function RoleDonut({ byRole }: RoleDonutProps) {
	const data = SLICES.map((s) => ({
		name: s.name,
		value: byRole[s.key],
		color: s.color,
	}));
	const total = data.reduce((sum, d) => sum + d.value, 0);

	if (total === 0) {
		return (
			<div className="flex h-[260px] items-center justify-center text-muted-foreground">
				Sem usuários.
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height={260}>
			<PieChart>
				<Pie
					data={data}
					dataKey="value"
					nameKey="name"
					cx="50%"
					cy="50%"
					innerRadius={64}
					outerRadius={96}
					paddingAngle={2}
					strokeWidth={0}
				>
					{data.map((d) => (
						<Cell key={d.name} fill={d.color} />
					))}
					<Label
						position="center"
						content={({ viewBox }) => {
							const vb = viewBox as { cx?: number; cy?: number } | undefined;
							if (vb?.cx == null || vb?.cy == null) return null;
							return (
								<text
									x={vb.cx}
									y={vb.cy}
									textAnchor="middle"
									dominantBaseline="middle"
								>
									<tspan
										x={vb.cx}
										dy="-0.2em"
										fontSize="24"
										fontWeight="700"
										fill="var(--foreground)"
									>
										{total}
									</tspan>
									<tspan
										x={vb.cx}
										dy="1.5em"
										fontSize="11"
										fill="var(--muted-foreground)"
									>
										usuários
									</tspan>
								</text>
							);
						}}
					/>
				</Pie>
				<Tooltip />
				<Legend />
			</PieChart>
		</ResponsiveContainer>
	);
}
