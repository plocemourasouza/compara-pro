export function LandingIcon({
	name,
	className = "icon",
}: {
	name: "arrow" | "file" | "compare" | "checklist" | "search";
	className?: string;
}) {
	return (
		<svg className={className} viewBox="0 0 24 24" aria-hidden="true">
			<use href={`#cp-${name === "search" ? "search-icon" : name}`} />
		</svg>
	);
}
