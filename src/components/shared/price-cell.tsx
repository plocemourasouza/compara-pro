import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const winningClass = "bg-success/10 font-semibold text-success";

export function WinningPrice({
	price,
	label = "Menor preço",
	className,
}: {
	price: number;
	label?: string;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-2 rounded-md px-2 py-1",
				winningClass,
				className,
			)}
		>
			{formatCurrency(price)}
			<span className="inline-flex items-center gap-1 text-xs font-medium">
				<Check className="size-3.5" aria-hidden />
				{label}
			</span>
		</span>
	);
}

export function PriceOffer({
	price,
	supplierName,
	best,
	selected = false,
	onSelect,
}: {
	price: number;
	supplierName: string;
	best: boolean;
	selected?: boolean;
	onSelect?: () => void;
}) {
	const name = best
		? `${formatCurrency(price)}, menor preço de ${supplierName}`
		: `${formatCurrency(price)} de ${supplierName}`;
	const pressed = selected ? ", oferta escolhida" : "";
	return (
		<button
			type="button"
			aria-pressed={selected}
			aria-label={`${name}${pressed}`}
			onClick={onSelect}
			className={cn(
				"inline-flex min-h-9 items-center gap-2 rounded-md px-2 py-1 text-left",
				best ? winningClass : "font-medium text-muted-foreground",
				selected && !best && "ring-2 ring-primary",
			)}
		>
			{formatCurrency(price)}
			{best && (
				<span className="inline-flex items-center gap-1 text-xs font-medium">
					<Check className="size-3.5" aria-hidden />
					Menor preço
				</span>
			)}
		</button>
	);
}
