/** Mesma marca da landing e da porta de acesso. */
export function BrandMark() {
	return (
		<div className="flex items-center gap-2.5">
			<svg
				viewBox="0 0 36 36"
				className="h-[33px] w-[33px] shrink-0"
				aria-hidden
			>
				<rect width="36" height="36" rx="8" fill="#245bcf" />
				<path d="M9 23h4V13H9zm7 4h4V9h-4zm7-6h4v-8h-4z" fill="#fff" />
			</svg>
			<div className="text-[22px] font-extrabold tracking-[-1px] text-foreground">
				compara<span className="font-medium text-primary">pró</span>
			</div>
		</div>
	);
}
