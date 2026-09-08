import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto genérico usado nos loading.tsx de cada área. Aproxima a forma
 * dos dashboards (cabeçalho com título/horário, grade de KPIs, dois blocos
 * de conteúdo maiores) em vez de um retângulo cinza sem relação com a página.
 */
export function PageSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div className="space-y-2">
					<Skeleton className="h-7 w-56" />
					<Skeleton className="h-4 w-72" />
				</div>
				<Skeleton className="h-4 w-40" />
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
				{[0, 1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-28 w-full" />
				))}
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Skeleton className="h-72 w-full" />
				<Skeleton className="h-72 w-full" />
			</div>
		</div>
	);
}
