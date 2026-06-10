/**
 * Cálculo de economia do cliente na tela de comparação.
 *
 * Economia = max(0, targetPrice − precoEscolhido) × quantidade, somada sobre os
 * itens incluídos com fornecedor escolhido. Mesma fórmula de
 * `savings.finalizedSavings` no dashboard admin (base = targetPrice no cliente /
 * baselinePrice no snapshot do pré-pedido).
 *
 * Funções puras — sem dependência de UI; shapes mínimos p/ structural typing.
 */

export interface SavingsMatch {
	id: string;
	clientProduct: { targetPrice?: number | null };
	supplierMatches: Array<{ supplier: { id: string }; price: number }>;
}

export interface SavingsSelection {
	included: boolean;
	supplierId: string;
	quantity: number;
}

/** Economia de um único item. 0 quando sem alvo, sem preço, ou preço ≥ alvo. */
export function calcItemSavings(
	targetPrice: number | null | undefined,
	chosenPrice: number | null | undefined,
	quantity: number,
): number {
	if (targetPrice == null || chosenPrice == null) return 0;
	const perUnit = targetPrice - chosenPrice;
	if (perUnit <= 0) return 0;
	return perUnit * quantity;
}

/** Soma da economia dos itens incluídos, usando o preço do fornecedor escolhido. */
export function calcTotalSavings(
	matches: SavingsMatch[],
	selections: Record<string, SavingsSelection>,
): number {
	return matches.reduce((total, match) => {
		const selection = selections[match.id];
		if (!selection?.included || !selection.supplierId) return total;

		const chosen = match.supplierMatches.find(
			(s) => s.supplier.id === selection.supplierId,
		);

		return (
			total +
			calcItemSavings(
				match.clientProduct.targetPrice,
				chosen?.price,
				selection.quantity,
			)
		);
	}, 0);
}
