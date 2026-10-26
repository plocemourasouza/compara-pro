"use client";

import { Plus } from "lucide-react";
import { PriceOffer } from "@/components/shared/price-cell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ComparisonSupplierColumn {
	id: string;
	name: string;
}

export interface ComparisonOffer {
	supplierId: string;
	price: number;
}

export interface ComparisonTableRow {
	id: string;
	name: string;
	meta?: string;
	quantity: number;
	included: boolean;
	offers: ComparisonOffer[];
	bestPrice?: number | null;
	selectedSupplierId?: string;
	unmatched: boolean;
}

interface ComparisonTableProps {
	suppliers: ComparisonSupplierColumn[];
	rows: ComparisonTableRow[];
	onToggleIncluded: (id: string, included: boolean) => void;
	onQuantityChange: (id: string, quantity: number) => void;
	onSelectSupplier: (id: string, supplierId: string) => void;
	onManualMatch?: (id: string) => void;
}

const stickyItem = "sticky left-10 z-10 min-w-56 bg-card group-hover:bg-muted";
const stickyCheck = "sticky left-0 z-10 w-10 bg-card group-hover:bg-muted";

function winningSupplier(
	row: ComparisonTableRow,
	suppliers: ComparisonSupplierColumn[],
) {
	if (row.bestPrice == null) return undefined;
	const offer = row.offers.find((item) => item.price === row.bestPrice);
	if (!offer) return undefined;
	return suppliers.find((supplier) => supplier.id === offer.supplierId);
}

export function ComparisonTable({
	suppliers,
	rows,
	onToggleIncluded,
	onQuantityChange,
	onSelectSupplier,
	onManualMatch,
}: ComparisonTableProps) {
	return (
		<div className="space-y-3">
			<Table>
				<caption className="sr-only">
					Preços unitários dos fornecedores da carteira. O menor preço de cada
					linha aparece em verde, com o nome na coluna Melhor oferta.
				</caption>
				<TableHeader>
					<TableRow>
						<TableHead className={stickyCheck}>
							<span className="sr-only">Incluir</span>
						</TableHead>
						<TableHead className={stickyItem}>Item da lista</TableHead>
						<TableHead>Quantidade</TableHead>
						{suppliers.map((supplier) => (
							<TableHead key={supplier.id}>
								{supplier.name}
								<span className="mt-0.5 block text-xs font-normal text-muted-foreground">
									Preço unitário
								</span>
							</TableHead>
						))}
						<TableHead>Melhor oferta</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.map((row) => {
						const winner = winningSupplier(row, suppliers);
						const chosen = row.offers.find(
							(offer) => offer.supplierId === row.selectedSupplierId,
						);
						const above =
							chosen && row.bestPrice != null
								? chosen.price - row.bestPrice
								: 0;
						return (
							<TableRow key={row.id} className="group">
								<TableCell className={stickyCheck}>
									<Checkbox
										checked={row.included}
										disabled={row.unmatched}
										aria-label={`Incluir ${row.name}`}
										onCheckedChange={(checked) =>
											onToggleIncluded(row.id, checked === true)
										}
									/>
								</TableCell>
								<TableCell className={cn(stickyItem, "whitespace-normal")}>
									<p className="font-medium text-foreground">{row.name}</p>
									{row.meta && (
										<p className="text-xs text-muted-foreground">{row.meta}</p>
									)}
									{row.unmatched && (
										<p className="mt-1 text-sm text-muted-foreground">
											Produto não encontrado nos fornecedores
										</p>
									)}
									{above > 0 && (
										<p className="mt-1 text-xs text-destructive">
											+{formatCurrency(above)} acima do melhor preço
										</p>
									)}
								</TableCell>
								<TableCell>
									{row.unmatched ? (
										<span className="text-muted-foreground">—</span>
									) : (
										<Input
											type="number"
											min={1}
											aria-label={`Quantidade de ${row.name}`}
											className="w-20"
											value={row.quantity}
											onChange={(event) =>
												onQuantityChange(
													row.id,
													Math.max(1, Number(event.target.value) || 1),
												)
											}
										/>
									)}
								</TableCell>
								{suppliers.map((supplier) => {
									const offer = row.offers.find(
										(item) => item.supplierId === supplier.id,
									);
									return (
										<TableCell key={supplier.id}>
											{offer ? (
												<PriceOffer
													price={offer.price}
													supplierName={supplier.name}
													best={
														row.bestPrice != null &&
														offer.price === row.bestPrice
													}
													selected={row.selectedSupplierId === supplier.id}
													onSelect={() => onSelectSupplier(row.id, supplier.id)}
												/>
											) : (
												<span className="text-muted-foreground">
													—
													<span className="sr-only">
														Sem oferta de {supplier.name}
													</span>
												</span>
											)}
										</TableCell>
									);
								})}
								<TableCell>
									{row.unmatched ? (
										<Button
											variant="outline"
											size="sm"
											onClick={() => onManualMatch?.(row.id)}
										>
											<Plus className="h-4 w-4" />
											Buscar manualmente
										</Button>
									) : (
										<span className="font-medium text-success">
											{winner?.name ?? "—"}
										</span>
									)}
								</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
			<p className="flex items-center gap-2 text-sm text-muted-foreground">
				<span
					className="inline-block size-3 rounded-sm bg-success/10 ring-1 ring-success/30"
					aria-hidden
				/>
				Verde = menor preço da linha.
			</p>
		</div>
	);
}
