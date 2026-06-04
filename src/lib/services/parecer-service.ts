import { getAiConfigForServer } from "@/lib/ai/config-service";
import { getProvider } from "@/lib/ai/registry";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";

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

export interface Parecer {
	resumo: string;
	oportunidades: ParecerOportunidade[];
	totais: ParecerTotais;
	vantagens: string[];
	geradoPorIA: boolean;
	geradoEm: string;
}

interface ParecerFacts {
	oportunidades: ParecerOportunidade[];
	totais: ParecerTotais;
}

const SYSTEM_PROMPT =
	"Você é um perito em compras (procurement) B2B. Responda em português do Brasil, " +
	"de forma objetiva e profissional. NÃO invente números — os valores já foram calculados " +
	"e estão no contexto. Produza apenas um parecer textual e vantagens.";

// biome-ignore lint/complexity/noStaticOnlyClass: intentional static service namespace
export class ParecerService {
	static async getOrGenerate(comparisonId: string): Promise<Parecer> {
		const cacheKey = `parecer:${comparisonId}`;
		const cached = cache.comparisons.get(cacheKey) as Parecer | undefined;
		if (cached) {
			return cached;
		}

		const facts = await ParecerService.computeFacts(comparisonId);
		const narrative = await ParecerService.generateNarrative(facts);

		const parecer: Parecer = {
			...facts,
			resumo: narrative.resumo,
			vantagens: narrative.vantagens,
			geradoPorIA: narrative.geradoPorIA,
			geradoEm: new Date().toISOString(),
		};

		cache.comparisons.set(cacheKey, parecer, 5 * 60 * 1000);
		return parecer;
	}

	private static async computeFacts(
		comparisonId: string,
	): Promise<ParecerFacts> {
		const comparison = await prisma.comparison.findUnique({
			where: { id: comparisonId },
			include: {
				matches: {
					include: {
						clientProduct: { select: { name: true } },
						supplierMatches: {
							include: { supplierCompany: { select: { name: true } } },
						},
					},
				},
			},
		});

		if (!comparison) {
			throw new Error("Comparação não encontrada");
		}

		const oportunidades: ParecerOportunidade[] = [];
		let economiaEstimada = 0;
		const bestSupplierWins = new Map<string, number>();

		for (const match of comparison.matches) {
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
					economiaPercentual:
						maxAlt > 0 ? (economiaUnitaria / maxAlt) * 100 : 0,
				});
			}
		}

		oportunidades.sort((a, b) => b.economiaUnitaria - a.economiaUnitaria);

		let fornecedorMaisVantajoso: ParecerTotais["fornecedorMaisVantajoso"] =
			null;
		for (const [nome, itens] of bestSupplierWins) {
			if (!fornecedorMaisVantajoso || itens > fornecedorMaisVantajoso.itens) {
				fornecedorMaisVantajoso = { nome, itens };
			}
		}

		const totalMelhorPreco = comparison.bestPriceTotal ?? 0;
		const totais: ParecerTotais = {
			totalProdutos: comparison.totalProducts,
			produtosComMatch: comparison.matchedProducts,
			produtosSemMatch: comparison.unmatchedProducts,
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

	private static async generateNarrative(
		facts: ParecerFacts,
	): Promise<{ resumo: string; vantagens: string[]; geradoPorIA: boolean }> {
		const config = await getAiConfigForServer();
		if (config) {
			try {
				const text = await getProvider(config.provider).generate({
					model: config.model,
					key: config.key,
					system: SYSTEM_PROMPT,
					prompt: ParecerService.buildPrompt(facts),
					maxTokens: 700,
				});
				const parsed = ParecerService.parseNarrative(text);
				if (parsed) {
					return { ...parsed, geradoPorIA: true };
				}
			} catch (error) {
				console.error(
					"Parecer AI generation failed:",
					error instanceof Error ? error.message : "unknown",
				);
			}
		}
		return { ...ParecerService.fallbackNarrative(facts), geradoPorIA: false };
	}

	private static buildPrompt(facts: ParecerFacts): string {
		const fatos = {
			totais: facts.totais,
			melhoresOportunidades: facts.oportunidades,
		};
		return [
			"Analise o cruzamento de planilhas de uma comparação de preços B2B.",
			"Fatos já calculados (não altere os números):",
			JSON.stringify(fatos, null, 2),
			"",
			'Responda APENAS com JSON válido no formato: {"resumo": string, "vantagens": string[]}.',
			"- resumo: parecer de 2 a 4 frases sobre a operação, destacando a economia e a recomendação.",
			"- vantagens: 3 a 5 itens curtos com as vantagens da sugestão do sistema.",
		].join("\n");
	}

	private static parseNarrative(
		text: string,
	): { resumo: string; vantagens: string[] } | null {
		const start = text.indexOf("{");
		const end = text.lastIndexOf("}");
		if (start !== -1 && end > start) {
			try {
				const obj: unknown = JSON.parse(text.slice(start, end + 1));
				if (obj && typeof obj === "object") {
					const record = obj as Record<string, unknown>;
					const resumo =
						typeof record.resumo === "string" ? record.resumo.trim() : "";
					const vantagens = Array.isArray(record.vantagens)
						? record.vantagens.filter((v): v is string => typeof v === "string")
						: [];
					if (resumo) {
						return { resumo, vantagens };
					}
				}
			} catch {
				// fall through to plain-text handling
			}
		}
		const trimmed = text.trim();
		return trimmed ? { resumo: trimmed.slice(0, 800), vantagens: [] } : null;
	}

	private static fallbackNarrative(facts: ParecerFacts): {
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
}

function formatBRL(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
}
