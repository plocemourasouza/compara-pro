"use client";

import { CheckCircle2, Clock, XCircle } from "lucide-react";
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
			<DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						Pré-pedido {preOrder ? `#${preOrder.id.slice(-8)}` : ""}
					</DialogTitle>
					<DialogDescription className="sr-only">
						Detalhes do pré-pedido selecionado.
					</DialogDescription>
				</DialogHeader>

				{preOrder && (
					<div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
						<Field label="Cliente" value={preOrder.client.name} />
						<Field label="Fornecedor" value={preOrder.supplier.name} />
						<Field
							label="Status"
							value={
								<Badge className={PRE_ORDER_STATUS[preOrder.status].className}>
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
								preOrder.totalAmount
									? formatters.currency(preOrder.totalAmount)
									: "-"
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
								<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
									Observações
								</p>
								<p className="mt-0.5 text-sm">{preOrder.notes}</p>
							</div>
						)}
					</div>
				)}

				{preOrder && (
					<div>
						<h4 className="mb-2 text-sm font-semibold">Itens</h4>
						{itemsLoading ? (
							<div className="flex items-center justify-center py-6">
								<Clock className="h-6 w-6 animate-spin text-primary" />
							</div>
						) : items.length > 0 ? (
							<div className="overflow-hidden rounded-lg border">
								<table className="w-full text-sm">
									<thead className="bg-muted">
										<tr>
											<th className="px-3 py-2 text-left">Produto</th>
											<th className="px-3 py-2 text-right">Qtd</th>
											<th className="px-3 py-2 text-right">Preço</th>
											<th className="px-3 py-2 text-right">Subtotal</th>
										</tr>
									</thead>
									<tbody>
										{items.map((item) => (
											<tr key={item.id} className="border-t">
												<td className="px-3 py-2">
													<div>{item.name}</div>
													{(item.sku || item.code) && (
														<div className="text-xs text-muted-foreground">
															{item.sku || item.code}
														</div>
													)}
												</td>
												<td className="px-3 py-2 text-right">
													{item.quantity}
												</td>
												<td className="px-3 py-2 text-right">
													{formatters.currency(item.price)}
												</td>
												<td className="px-3 py-2 text-right">
													{formatters.currency(item.totalPrice)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						) : (
							<p className="text-sm text-muted-foreground">
								Sem itens para exibir.
							</p>
						)}
					</div>
				)}

				{rejecting && (
					<Textarea
						placeholder="Motivo da rejeição (obrigatório)..."
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>
				)}

				<DialogFooter>
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
			<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</p>
			<dd className="mt-0.5 text-sm">{value}</dd>
		</div>
	);
}
