type BrandMarkProps = {
	/** Tamanho do símbolo em px. */
	size?: number;
	/** Esconde o wordmark e deixa só o símbolo. */
	symbolOnly?: boolean;
	className?: string;
};

/** Marca oficial Compara PRÓ (símbolo + wordmark). */
export function BrandMark({
	size = 33,
	symbolOnly = false,
	className,
}: BrandMarkProps) {
	return (
		<span
			className={["inline-flex items-center gap-2.5", className]
				.filter(Boolean)
				.join(" ")}
		>
			{/* SVG estático em /public — img evita o pipeline do next/image. */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src="/brand/compara-pro-simbolo.svg"
				alt=""
				width={size}
				height={size}
				className="shrink-0"
				decoding="async"
			/>
			{!symbolOnly ? (
				<span className="text-[22px] font-extrabold tracking-[-1px] text-foreground">
					Compara <span className="font-bold text-primary">PRÓ</span>
				</span>
			) : null}
		</span>
	);
}
