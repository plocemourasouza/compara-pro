import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const winningClass = "bg-[#edf6ef] font-mono font-semibold text-[#1f6041]";

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
			<span className="inline-flex items-center gap-1 font-sans text-[10px] font-medium text-[#2f674c]">
				<span className="inline-grid size-[15px] place-items-center rounded-full bg-[#d7ebdc]">
					<Check className="size-2.5" aria-hidden />
				</span>
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
				<span className="inline-flex items-center gap-1 font-sans text-[10px] font-medium text-[#2f674c]">
					<span className="inline-grid size-[15px] place-items-center rounded-full bg-[#d7ebdc]">
						<Check className="size-2.5" aria-hidden />
					</span>
					Menor preço
				</span>
			)}
		</button>
	);
}
