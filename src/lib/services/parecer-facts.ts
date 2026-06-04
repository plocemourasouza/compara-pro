// Pure deterministic engine for the parecer — no I/O, no Prisma — so it is
// cheap to unit-test and the LLM never produces any of these numbers.

export interface ParecerOportunidade {
	produto: string;
	fornecedorRecomendado: string;
	precoRecomendado: number;
	precoAlternativaMax: number;
	economiaUnitaria: number;
	economiaPercentual: number;
}

export interface ParecerTotais {
	totalProdutos: number;
	produtosComMatch: number;
	produtosSemMatch: number;
	totalMelhorPreco: number;
	economiaEstimada: number;
	economiaPercentual: number;
	fornecedoresEnvolvidos: number;
	fornecedorMaisVantajoso: { nome: string; itens: number } | null;
}

export interface ParecerFacts {
	oportunidades: ParecerOportunidade[];
	totais: ParecerTotais;
}

/** Shape (subset of the Prisma query) the deterministic engine consumes. */
export interface ParecerMatchInput {
	clientProduct: { name: string };
	bestPrice: number | null;
	supplierMatches: { price: number; supplierCompany: { name: string } }[];
}

export interface ParecerTotalsInput {
	totalProducts: number;
	matchedProducts: number;
	unmatchedProducts: number;
	bestPriceTotal: number | null;
}

export function formatBRL(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
}

/** Deterministic facts from the cross-analysis. Numbers NEVER come from the LLM. */
export function computeParecerFacts(
	matches: ParecerMatchInput[],
	totals: ParecerTotalsInput,
): ParecerFacts {
	const oportunidades: ParecerOportunidade[] = [];
	let economiaEstimada = 0;
	const bestSupplierWins = new Map<string, number>();

	for (const match of matches) {
		if (match.supplierMatches.length === 0) continue;

		const prices = match.supplierMatches.map((sm) => sm.price);
		const best = match.bestPrice ?? Math.min(...prices);
		const maxAlt = Math.max(...prices);
		const bestSm =
			match.supplierMatches.find((sm) => sm.price === best) ??
			match.supplierMatches[0];
		if (!bestSm) continue;

		const fornecedor = bestSm.supplierCompany.name;
		bestSupplierWins.set(
			fornecedor,
			(bestSupplierWins.get(fornecedor) ?? 0) + 1,
		);

		const economiaUnitaria = maxAlt - best;
		economiaEstimada += economiaUnitaria;

		if (economiaUnitaria > 0) {
			oportunidades.push({
				produto: match.clientProduct.name,
				fornecedorRecomendado: fornecedor,
				precoRecomendado: best,
				precoAlternativaMax: maxAlt,
				economiaUnitaria,
				economiaPercentual: maxAlt > 0 ? (economiaUnitaria / maxAlt) * 100 : 0,
			});
		}
	}

	oportunidades.sort((a, b) => b.economiaUnitaria - a.economiaUnitaria);

	let fornecedorMaisVantajoso: ParecerTotais["fornecedorMaisVantajoso"] = null;
	for (const [nome, itens] of bestSupplierWins) {
		if (!fornecedorMaisVantajoso || itens > fornecedorMaisVantajoso.itens) {
			fornecedorMaisVantajoso = { nome, itens };
		}
	}

	const totalMelhorPreco = totals.bestPriceTotal ?? 0;
	const totais: ParecerTotais = {
		totalProdutos: totals.totalProducts,
		produtosComMatch: totals.matchedProducts,
		produtosSemMatch: totals.unmatchedProducts,
		totalMelhorPreco,
		economiaEstimada,
		economiaPercentual:
			totalMelhorPreco + economiaEstimada > 0
				? (economiaEstimada / (totalMelhorPreco + economiaEstimada)) * 100
				: 0,
		fornecedoresEnvolvidos: bestSupplierWins.size,
		fornecedorMaisVantajoso,
	};

	return { oportunidades: oportunidades.slice(0, 5), totais };
}

/** Deterministic narrative used when no AI is configured or the LLM call fails. */
export function fallbackNarrative(facts: ParecerFacts): {
	resumo: string;
	vantagens: string[];
} {
	const t = facts.totais;
	const economia = formatBRL(t.economiaEstimada);
	const total = formatBRL(t.totalMelhorPreco);
	const pct = t.economiaPercentual.toFixed(1).replace(".", ",");
	const consolidacao = t.fornecedorMaisVantajoso
		? `O fornecedor mais vantajoso é ${t.fornecedorMaisVantajoso.nome}, com o melhor preço em ${t.fornecedorMaisVantajoso.itens} item(ns). `
		: "";

	const resumo =
		`A sugestão do sistema reúne ${t.produtosComMatch} de ${t.totalProdutos} produtos no melhor preço, ` +
		`totalizando ${total} e uma economia estimada de ${economia} (${pct}%) frente às alternativas mais caras. ` +
		`${consolidacao}` +
		(t.produtosSemMatch > 0
			? `${t.produtosSemMatch} produto(s) não tiveram correspondência e podem ser buscados manualmente.`
			: "Todos os produtos tiveram correspondência.");

	const vantagens = [
		`Economia estimada de ${economia} (${pct}%) sobre as alternativas mais caras.`,
		`Melhor preço aplicado em ${t.produtosComMatch} produto(s).`,
		t.fornecedorMaisVantajoso
			? `Possibilidade de consolidar pedidos em ${t.fornecedorMaisVantajoso.nome}.`
			: "Comparação entre múltiplos fornecedores num só lugar.",
		"Você pode ajustar a indicação por produto antes de confirmar o pré-pedido.",
	];

	return { resumo, vantagens };
}
