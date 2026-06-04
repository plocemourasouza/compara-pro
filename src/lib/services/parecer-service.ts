import { getAiConfigForServer } from "@/lib/ai/config-service";
import { DEFAULT_PARECER_SYSTEM_PROMPT } from "@/lib/ai/default-prompt";
import { getProvider } from "@/lib/ai/registry";
import { cache } from "@/lib/cache";
import { prisma } from "@/lib/db";
import {
	computeParecerFacts,
	fallbackNarrative,
	type ParecerFacts,
	type ParecerOportunidade,
	type ParecerTotais,
} from "./parecer-facts";

export type {
	ParecerFacts,
	ParecerOportunidade,
	ParecerTotais,
} from "./parecer-facts";

export interface Parecer {
	resumo: string;
	oportunidades: ParecerOportunidade[];
	totais: ParecerTotais;
	vantagens: string[];
	geradoPorIA: boolean;
	geradoEm: string;
}

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

		return computeParecerFacts(comparison.matches, {
			totalProducts: comparison.totalProducts,
			matchedProducts: comparison.matchedProducts,
			unmatchedProducts: comparison.unmatchedProducts,
			bestPriceTotal: comparison.bestPriceTotal,
		});
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
					system: config.systemPrompt?.trim() || DEFAULT_PARECER_SYSTEM_PROMPT,
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
		return { ...fallbackNarrative(facts), geradoPorIA: false };
	}

	private static buildPrompt(facts: ParecerFacts): string {
		const round = (n: number) => Math.round(n * 100) / 100;
		const fatos = {
			totais: {
				...facts.totais,
				totalMelhorPreco: round(facts.totais.totalMelhorPreco),
				economiaEstimada: round(facts.totais.economiaEstimada),
				economiaPercentual: round(facts.totais.economiaPercentual),
			},
			melhoresOportunidades: facts.oportunidades.map((o) => ({
				...o,
				precoRecomendado: round(o.precoRecomendado),
				precoAlternativaMax: round(o.precoAlternativaMax),
				economiaUnitaria: round(o.economiaUnitaria),
				economiaPercentual: round(o.economiaPercentual),
			})),
		};
		return [
			"Analise o cruzamento de planilhas de uma comparação de preços B2B.",
			"Valores monetários em reais (R$); percentuais já arredondados.",
			"Fatos já calculados (não altere os números):",
			JSON.stringify(fatos, null, 2),
			"",
			'Responda APENAS com JSON válido no formato: {"resumo": string, "vantagens": string[]}.',
			"- resumo: parecer de 2 a 4 frases sobre a operação, destacando a economia e a recomendação.",
			"- vantagens: 3 a 5 itens curtos com as vantagens da sugestão do sistema.",
			"- Use R$ e % ao citar valores; não escreva números com muitas casas decimais.",
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
}
