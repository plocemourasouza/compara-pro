"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
	PRE_ORDER_STATUS,
	type PreOrder,
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

	// biome-ignore lint/correctness/useExhaustiveDependencies: reset reject flow when modal/order changes
	useEffect(() => {
		setRejecting(false);
		setNotes("");
	}, [open, preOrder?.id]);

	const showActions = canRespond && preOrder?.status === "ACTIVE";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
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
