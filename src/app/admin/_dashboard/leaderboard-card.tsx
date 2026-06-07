import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface LeaderboardItem {
	id: string;
	name: string;
	value: number;
}

interface LeaderboardCardProps {
	title: string;
	description: string;
	items: LeaderboardItem[];
	valueFormatter: (value: number) => string;
	emptyLabel?: string;
}

/** Ranked list (rank circle + name + value badge) — same markup as the
 * top-products list in reports-client.tsx. */
export function LeaderboardCard({
	title,
	description,
	items,
	valueFormatter,
	emptyLabel = "Ainda não há dados.",
}: LeaderboardCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>
				{items.length === 0 ? (
					<p className="text-sm text-muted-foreground">{emptyLabel}</p>
				) : (
					<div className="space-y-3">
						{items.map((item, index) => (
							<div
								key={item.id}
								className="flex items-center justify-between rounded-lg border p-3"
							>
								<div className="flex items-center gap-3">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
										{index + 1}
									</div>
									<p className="font-medium">{item.name}</p>
								</div>
								<Badge variant="outline">{valueFormatter(item.value)}</Badge>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
