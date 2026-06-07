"use client";

import { ArrowLeft, Loader2, TriangleAlert } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatters } from "@/lib/utils/masks";

interface Indications {
	fileName: string;
	resumo: {
		totalItems: number;
		matchedItems: number;
		coveredItems: number;
		coveragePct: number;
		offeredValue: number;
		bestPriceItems: number;
		gapItems: number;
	};
	items: Array<{
		clientName: string;
		sku: string | null;
		code: string | null;
		quantity: number | null;
		supplierName: string;
		supplierSku: string | null;
		price: number;
		matchType: string;
		confidence: number;
		bestPrice: number;
		isBest: boolean;
	}>;
	gaps: Array<{
		clientName: string;
		sku: string | null;
		code: string | null;
		quantity: number | null;
		bestPriceElsewhere: number | null;
		otherSuppliers: number;
	}>;
}

const MATCH_LABEL: Record<string, string> = {
	SKU: "SKU",
	CODE: "Código",
	NAME: "Nome",
	MANUAL: "Manual",
};

export default function IndicationsClient({
	clientId,
	uploadId,
}: {
	clientId: string;
	uploadId: string;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const supplierCompanyId = searchParams.get("supplierCompanyId");
	const [data, setData] = useState<Indications | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const qs = supplierCompanyId
			? `?supplierCompanyId=${supplierCompanyId}`
			: "";
		fetch(`/api/supplier/clients/${clientId}/indications/${uploadId}${qs}`)
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.then((d) => setData(d))
			.catch(() => toast.error("Não foi possível gerar as indicações."))
			.finally(() => setLoading(false));
	}, [clientId, uploadId, supplierCompanyId]);

	if (loading) {
		return (
			<div className="flex items-center gap-2 py-12 text-muted-foreground">
				<Loader2 className="h-5 w-5 animate-spin" />
				Gerando indicações do seu catálogo…
			</div>
		);
	}
	if (!data) {
		return (
			<p className="text-muted-foreground text-sm">
				Não foi possível gerar as indicações.
			</p>
		);
	}

	const { resumo } = data;
	const cards = [
		{ label: "Cobertura", value: `${resumo.coveragePct}%` },
		{
			label: "Itens atendidos",
			value: `${resumo.coveredItems}/${resumo.totalItems}`,
		},
		{ label: "Você é o menor preço", value: `${resumo.bestPriceItems}` },
		{
			label: "Valor ofertado",
			value: formatters.currency(resumo.offeredValue),
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push(`/supplier/clients/${clientId}`)}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Indicações</h1>
					<p className="text-muted-foreground">
						Seu catálogo contra a demanda “{data.fileName}”.
					</p>
				</div>
			</div>

			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{cards.map((c) => (
					<Card key={c.label}>
						<CardHeader className="pb-2">
							<CardTitle className="font-medium text-muted-foreground text-sm">
								{c.label}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">{c.value}</div>
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Produtos que você atende</CardTitle>
					<CardDescription>
						{resumo.coveredItems} de {resumo.totalItems} itens da demanda.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{data.items.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Nenhum item da demanda casou com o seu catálogo.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Item do cliente</TableHead>
									<TableHead>Seu produto</TableHead>
									<TableHead>Match</TableHead>
									<TableHead className="text-right">Seu preço</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.items.map((it) => (
									<TableRow
										key={`${it.clientName}-${it.supplierSku ?? it.supplierName}`}
									>
										<TableCell>
											<p className="font-medium">{it.clientName}</p>
											<p className="text-muted-foreground text-xs">
												{it.sku || it.code || "—"}
												{it.quantity ? ` · ${it.quantity} un` : ""}
											</p>
										</TableCell>
										<TableCell>{it.supplierName}</TableCell>
										<TableCell>
											<div className="flex items-center gap-1">
												<Badge variant="outline">
													{MATCH_LABEL[it.matchType] ?? it.matchType}
												</Badge>
												<span className="text-muted-foreground text-xs">
													{Math.round(it.confidence * 100)}%
												</span>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<div className="flex items-center justify-end gap-2">
												<span className="font-medium">
													{formatters.currency(it.price)}
												</span>
												{it.isBest && (
													<Badge variant="default" className="text-xs">
														menor
													</Badge>
												)}
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{data.gaps.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<TriangleAlert className="h-5 w-5 text-amber-500" />
							Oportunidades (concorrência atende, você não)
						</CardTitle>
						<CardDescription>
							Itens da demanda que outros fornecedores cobrem e o seu catálogo
							não.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Item do cliente</TableHead>
									<TableHead className="text-right">Fornecedores</TableHead>
									<TableHead className="text-right">Menor preço</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.gaps.map((g) => (
									<TableRow key={`${g.clientName}-${g.sku ?? g.code ?? ""}`}>
										<TableCell>
											<p className="font-medium">{g.clientName}</p>
											<p className="text-muted-foreground text-xs">
												{g.sku || g.code || "—"}
												{g.quantity ? ` · ${g.quantity} un` : ""}
											</p>
										</TableCell>
										<TableCell className="text-right">
											{g.otherSuppliers}
										</TableCell>
										<TableCell className="text-right">
											{g.bestPriceElsewhere != null
												? formatters.currency(g.bestPriceElsewhere)
												: "—"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
