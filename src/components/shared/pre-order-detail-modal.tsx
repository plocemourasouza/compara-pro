"use client";

import { CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
	PRE_ORDER_STATUS,
	type PreOrder,
	type PreOrderItem,
} from "@/components/shared/pre-order-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
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

interface PreOrderDetailModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	preOrder: PreOrder | null;
	/** Show Aprovar/Rejeitar (supplier on ACTIVE orders). */
	canRespond?: boolean;
	busy?: boolean;
	onApprove?: (id: string) => void;
	onReject?: (id: string, notes: string) => void;
}

export function PreOrderDetailModal({
	open,
	onOpenChange,
	preOrder,
	canRespond = false,
	busy = false,
	onApprove,
	onReject,
}: PreOrderDetailModalProps) {
	const [rejecting, setRejecting] = useState(false);
	const [notes, setNotes] = useState("");
	const [items, setItems] = useState<PreOrderItem[]>([]);
	const [itemsLoading, setItemsLoading] = useState(false);

	useEffect(() => {
		setRejecting(false);
		setNotes("");
		setItems([]);
		if (!open || !preOrder?.id) return;
		const id = preOrder.id;
		setItemsLoading(true);
		fetch(`/api/pre-order/${id}`)
			.then((res) => (res.ok ? res.json() : Promise.reject(res)))
			.then((data) => setItems(data.preOrder?.items ?? []))
			.catch(() => setItems([]))
			.finally(() => setItemsLoading(false));
	}, [open, preOrder?.id]);

	const showActions = canRespond && preOrder?.status === "ACTIVE";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-[60vh] w-[40vw] max-w-[40vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[40vw]">
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle>
						Pré-pedido {preOrder ? `#${preOrder.id.slice(-8)}` : ""}
					</DialogTitle>
					<DialogDescription className="sr-only">
						Detalhes do pré-pedido selecionado.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 space-y-7 overflow-y-auto px-6 py-5">
					{preOrder && (
						<dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
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
								<div className="sm:col-span-2">
									<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
										Observações
									</dt>
									<dd className="mt-1 text-sm leading-relaxed text-foreground">
										{preOrder.notes}
									</dd>
								</div>
							)}
						</dl>
					)}

					{preOrder && (
						<section className="space-y-3">
							<h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
								<Package className="size-4 text-muted-foreground" />
								Itens
							</h4>
							{itemsLoading ? (
								<div className="flex items-center justify-center py-6">
									<Clock className="h-6 w-6 animate-spin text-primary" />
								</div>
							) : items.length > 0 ? (
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
													<TableCell className="text-right tabular-nums text-muted-foreground">
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
						</section>
					)}

					{rejecting && (
						<Textarea
							placeholder="Motivo da rejeição (obrigatório)..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					)}
				</div>

				<DialogFooter className="border-t px-6 py-4">
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
								onClick={() =>
									preOrder && onReject?.(preOrder.id, notes.trim())
								}
							>
								Confirmar rejeição
							</Button>
						</>
					) : (
						<>
							<DialogClose asChild>
								<Button variant="outline">Fechar</Button>
							</DialogClose>
							{showActions && (
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
										onClick={() => preOrder && onApprove?.(preOrder.id)}
									>
										<CheckCircle2 className="mr-2 h-4 w-4" />
										Aprovar
									</Button>
								</>
							)}
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
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
