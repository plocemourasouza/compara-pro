"use client";

import { ArrowLeft, CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
	PRE_ORDER_STATUS,
	type PreOrder,
	type PreOrderItem,
} from "@/components/shared/pre-order-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatters } from "@/lib/utils/masks";

type PreOrderDetail = PreOrder & { items: PreOrderItem[] };

interface PreOrderDetailViewProps {
	preOrderId: string;
	/** Show Aprovar/Rejeitar (representative on ACTIVE orders). */
	canRespond?: boolean;
	backHref: string;
}

export function PreOrderDetailView({
	preOrderId,
	canRespond = false,
	backHref,
}: PreOrderDetailViewProps) {
	const router = useRouter();
	const [preOrder, setPreOrder] = useState<PreOrderDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [rejecting, setRejecting] = useState(false);
	const [notes, setNotes] = useState("");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let active = true;
		setLoading(true);
		setError(null);
		fetch(`/api/pre-order/${preOrderId}`)
			.then((res) =>
				res.ok ? res.json() : Promise.reject(new Error(String(res.status))),
			)
			.then((data) => {
				if (active) setPreOrder(data.preOrder ?? null);
			})
			.catch(() => {
				if (active) setError("Pré-pedido não encontrado ou acesso negado.");
			})
			.finally(() => {
				if (active) setLoading(false);
			});
		return () => {
			active = false;
		};
	}, [preOrderId]);

	const items = preOrder?.items ?? [];

	const savings = useMemo(() => {
		let total = 0;
		for (const it of items) {
			if (it.baselinePrice == null) continue;
			const delta = it.baselinePrice - it.price;
			if (delta > 0) total += delta * it.quantity;
		}
		return total;
	}, [items]);

	async function respond(action: "APPROVE" | "REJECT") {
		setBusy(true);
		try {
			const res = await fetch("/api/pre-order/bulk-action", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					preOrderIds: [preOrderId],
					action,
					notes: action === "REJECT" ? notes.trim() : undefined,
				}),
			});
			const data = (await res.json()) as { message?: string; error?: string };
			if (!res.ok) throw new Error(data.error ?? "Erro");
			toast.success(data.message ?? "Pré-pedido atualizado");
			router.push(backHref);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Erro");
		} finally {
			setBusy(false);
		}
	}

	const showActions = canRespond && preOrder?.status === "ACTIVE";

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="sm"
					onClick={() => router.push(backHref)}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Voltar
				</Button>
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-bold tracking-tight">
						Pré-pedido {preOrder ? `#${preOrder.id.slice(-8)}` : ""}
					</h1>
					{preOrder && (
						<Badge className={PRE_ORDER_STATUS[preOrder.status].className}>
							{PRE_ORDER_STATUS[preOrder.status].label}
						</Badge>
					)}
				</div>
			</div>

			{loading ? (
				<div className="flex flex-1 items-center justify-center py-12">
					<Clock className="h-6 w-6 animate-spin text-primary" />
				</div>
			) : error || !preOrder ? (
				<Card>
					<CardContent className="py-12 text-center text-sm text-muted-foreground">
						{error ?? "Pré-pedido não encontrado."}
					</CardContent>
				</Card>
			) : (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Resumo</CardTitle>
						</CardHeader>
						<CardContent>
							<dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
								<Field label="Cliente" value={preOrder.client.name} />
								<Field label="Fornecedor" value={preOrder.supplier.name} />
								<Field
									label="Status"
									value={
										<Badge
											className={PRE_ORDER_STATUS[preOrder.status].className}
										>
											{PRE_ORDER_STATUS[preOrder.status].label}
										</Badge>
									}
								/>
								<Field label="Itens" value={`${preOrder.itemCount} item(ns)`} />
								<Field
									label="Quantidade"
									value={`${preOrder.totalQuantity} unidade(s)`}
								/>
								<Field
									label="Valor total"
									value={
										preOrder.totalAmount ? (
											<span className="font-semibold text-foreground">
												{formatters.currency(preOrder.totalAmount)}
											</span>
										) : (
											"—"
										)
									}
								/>
								{savings > 0 && (
									<Field
										label="Economia"
										value={
											<span className="font-semibold text-emerald-600">
												{formatters.currency(savings)}
											</span>
										}
									/>
								)}
								<Field
									label="Criado em"
									value={formatters.datetime(preOrder.createdAt)}
								/>
								{preOrder.respondedAt && (
									<Field
										label="Respondido em"
										value={formatters.datetime(preOrder.respondedAt)}
									/>
								)}
								{preOrder.notes && (
									<div className="sm:col-span-2 lg:col-span-3">
										<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
											Observações
										</dt>
										<dd className="mt-1 text-sm leading-relaxed text-foreground">
											{preOrder.notes}
										</dd>
									</div>
								)}
							</dl>
						</CardContent>
					</Card>

					<Card className="flex min-h-0 flex-1 flex-col">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="size-4 text-muted-foreground" />
								Itens
							</CardTitle>
						</CardHeader>
						<CardContent className="flex min-h-0 flex-1 flex-col">
							{items.length > 0 ? (
								<div className="overflow-hidden rounded-lg border">
									<Table>
										<TableHeader>
											<TableRow className="bg-muted hover:bg-muted">
												<TableHead>Produto</TableHead>
												<TableHead className="text-right">Qtd</TableHead>
												<TableHead className="text-right">Preço</TableHead>
												<TableHead className="text-right">Subtotal</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{items.map((item) => (
												<TableRow key={item.id}>
													<TableCell>
														<div className="font-medium text-foreground">
															{item.name}
														</div>
														{(item.sku || item.code) && (
															<div className="font-mono text-xs text-muted-foreground">
																{item.sku || item.code}
															</div>
														)}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{item.quantity}
													</TableCell>
													<TableCell className="text-right tabular-nums">
														{formatters.currency(item.price)}
													</TableCell>
													<TableCell className="text-right font-medium tabular-nums">
														{formatters.currency(item.totalPrice)}
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</div>
							) : (
								<p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
									Sem itens para exibir.
								</p>
							)}
						</CardContent>
					</Card>

					{showActions && (
						<Card>
							<CardContent className="space-y-4 py-6">
								{rejecting && (
									<Textarea
										placeholder="Motivo da rejeição (obrigatório)..."
										value={notes}
										onChange={(e) => setNotes(e.target.value)}
									/>
								)}
								<div className="flex justify-end gap-2">
									{rejecting ? (
										<>
											<Button
												variant="outline"
												onClick={() => setRejecting(false)}
												disabled={busy}
											>
												Voltar
											</Button>
											<Button
												variant="destructive"
												disabled={busy || !notes.trim()}
												onClick={() => respond("REJECT")}
											>
												Confirmar rejeição
											</Button>
										</>
									) : (
										<>
											<Button
												variant="outline"
												className="text-destructive"
												disabled={busy}
												onClick={() => setRejecting(true)}
											>
												<XCircle className="mr-2 h-4 w-4" />
												Rejeitar
											</Button>
											<Button
												disabled={busy}
												onClick={() => respond("APPROVE")}
											>
												<CheckCircle2 className="mr-2 h-4 w-4" />
												Aprovar
											</Button>
										</>
									)}
								</div>
							</CardContent>
						</Card>
					)}
				</>
			)}
		</div>
	);
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="mt-1 text-sm leading-relaxed text-foreground">{value}</dd>
		</div>
	);
}
