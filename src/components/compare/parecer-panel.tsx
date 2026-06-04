"use client";

import { Sparkles, TrendingDown } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ParecerOportunidade {
	produto: string;
	fornecedorRecomendado: string;
	precoRecomendado: number;
	precoAlternativaMax: number;
	economiaUnitaria: number;
	economiaPercentual: number;
}
interface ParecerTotais {
	totalProdutos: number;
	produtosComMatch: number;
	produtosSemMatch: number;
	totalMelhorPreco: number;
	economiaEstimada: number;
	economiaPercentual: number;
	fornecedoresEnvolvidos: number;
	fornecedorMaisVantajoso: { nome: string; itens: number } | null;
}
interface Parecer {
	resumo: string;
	oportunidades: ParecerOportunidade[];
	totais: ParecerTotais;
	vantagens: string[];
	geradoPorIA: boolean;
	geradoEm: string;
}

function fmt(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
}

export default function ParecerPanel({
	comparisonId,
}: {
	comparisonId: string;
}) {
	const [parecer, setParecer] = useState<Parecer | null>(null);
	const [loading, setLoading] = useState(true);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setFailed(false);
		setParecer(null);
		fetch(`/api/comparison/${comparisonId}/parecer`)
			.then((r) => (r.ok ? r.json() : Promise.reject(new Error("erro"))))
			.then((d: { parecer: Parecer }) => {
				if (active) {
					setParecer(d.parecer);
					setLoading(false);
				}
			})
			.catch(() => {
				if (active) {
					setFailed(true);
					setLoading(false);
				}
			});
		return () => {
			active = false;
		};
	}, [comparisonId]);

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						Gerando parecer da operação…
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-5/6" />
					<Skeleton className="h-4 w-2/3" />
				</CardContent>
			</Card>
		);
	}

	if (failed || !parecer) {
		return null;
	}

	const t = parecer.totais;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between gap-2">
					<span className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						Parecer da operação
					</span>
					<Badge
						variant="outline"
						className={
							parecer.geradoPorIA
								? "border-primary text-primary"
								: "text-muted-foreground"
						}
					>
						{parecer.geradoPorIA ? "Análise por IA" : "Análise automática"}
					</Badge>
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-5">
				<p className="text-body leading-relaxed">{parecer.resumo}</p>

				<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
					<div>
						<p className="text-xs text-muted-foreground">Economia estimada</p>
						<p className="text-lg font-bold text-success">
							{fmt(t.economiaEstimada)}
						</p>
						<p className="text-xs text-muted-foreground">
							{t.economiaPercentual.toFixed(1)}%
						</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">
							Total (melhor preço)
						</p>
						<p className="text-lg font-bold">{fmt(t.totalMelhorPreco)}</p>
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Mais vantajoso</p>
						<p className="text-lg font-bold">
							{t.fornecedorMaisVantajoso?.nome ?? "—"}
						</p>
						{t.fornecedorMaisVantajoso && (
							<p className="text-xs text-muted-foreground">
								{t.fornecedorMaisVantajoso.itens} item(ns)
							</p>
						)}
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Sem correspondência</p>
						<p className="text-lg font-bold text-destructive">
							{t.produtosSemMatch}
						</p>
					</div>
				</div>

				{parecer.oportunidades.length > 0 && (
					<div>
						<h4 className="mb-2 text-sm font-semibold">
							Melhores oportunidades
						</h4>
						<div className="space-y-2">
							{parecer.oportunidades.map((o) => (
								<div
									key={o.produto}
									className="flex items-center justify-between rounded border border-border bg-muted/40 px-3 py-2 text-sm"
								>
									<div>
										<p className="font-medium">{o.produto}</p>
										<p className="text-xs text-muted-foreground">
											{o.fornecedorRecomendado} · {fmt(o.precoRecomendado)}
										</p>
									</div>
									<div className="flex items-center gap-1 text-success">
										<TrendingDown className="h-4 w-4" />
										<span className="font-semibold">
											{fmt(o.economiaUnitaria)} (
											{o.economiaPercentual.toFixed(0)}
											%)
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{parecer.vantagens.length > 0 && (
					<div>
						<h4 className="mb-2 text-sm font-semibold">
							Vantagens da sugestão
						</h4>
						<ul className="space-y-1">
							{parecer.vantagens.map((v) => (
								<li key={v} className="flex gap-2 text-sm text-body">
									<span className="text-primary">•</span>
									<span>{v}</span>
								</li>
							))}
						</ul>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
