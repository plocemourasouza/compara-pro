import { WinningPrice } from "@/components/shared/price-cell";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";

export interface DeskPreviewOffer {
	supplierName: string;
	price: number;
}

export interface DeskPreviewRow {
	id: string;
	name: string;
	offers: DeskPreviewOffer[];
	winner: string | null;
}

interface DeskPreviewProps {
	suppliers: string[];
	rows: DeskPreviewRow[];
}

/** Recorte só de leitura da mesa. A comparação completa continua em /client/compare. */
export function DeskPreview({ suppliers, rows }: DeskPreviewProps) {
	return (
		<div className="space-y-3">
			<div className="overflow-x-auto">
				<Table>
					<caption className="sr-only">
						Preços da lista mais recente. O menor preço de cada linha aparece em
						verde, com o nome na coluna Melhor oferta.
					</caption>
					<TableHeader>
						<TableRow>
							<TableHead className="min-w-40">Item</TableHead>
							{suppliers.map((name) => (
								<TableHead key={name} className="text-right">
									{name}
								</TableHead>
							))}
							<TableHead>Melhor oferta</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.map((row) => (
							<TableRow key={row.id}>
								<TableCell className="font-medium">{row.name}</TableCell>
								{suppliers.map((name) => {
									const offer = row.offers.find(
										(item) => item.supplierName === name,
									);
									const best =
										offer != null &&
										row.winner === name &&
										offer.price ===
											Math.min(...row.offers.map((item) => item.price));
									return (
										<TableCell
											key={name}
											className={
												best
													? "bg-[#edf6ef] text-right font-mono font-semibold text-[#1f6041]"
													: "text-right font-mono text-muted-foreground"
											}
										>
											{offer == null ? (
												<span className="font-sans text-muted-foreground">
													—
												</span>
											) : (
												formatCurrency(offer.price)
											)}
										</TableCell>
									);
								})}
								<TableCell>
									{row.winner && row.offers.length > 0 ? (
										<WinningPrice
											price={Math.min(...row.offers.map((item) => item.price))}
											label={row.winner}
										/>
									) : (
										<span className="text-muted-foreground">Sem oferta</span>
									)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<p className="text-muted-foreground text-xs">
				Verde = menor preço da linha.
			</p>
		</div>
	);
}
