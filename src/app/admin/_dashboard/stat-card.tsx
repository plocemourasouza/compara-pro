import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatCardProps {
	title: string;
	value: ReactNode;
	icon: LucideIcon;
	/** Tailwind text-color class for the icon (e.g. "text-success"). */
	iconClassName?: string;
	/** Small muted line under the value. */
	hint?: ReactNode;
}

/** Single-value KPI card — same layout as the original dashboard cards
 * (admin-dashboard.tsx): title + icon top-right, bold value, muted hint. */
export function StatCard({
	title,
	value,
	icon: Icon,
	iconClassName = "text-muted-foreground",
	hint,
}: StatCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				<Icon className={`h-4 w-4 ${iconClassName}`} />
			</CardHeader>
			<CardContent>
				<div className="text-2xl font-bold">{value}</div>
				{hint ? (
					<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium text-muted-foreground mt-1.5">
						{hint}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
