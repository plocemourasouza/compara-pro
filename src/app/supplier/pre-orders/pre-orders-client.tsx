"use client";

import { CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

interface SupplierUser {
	id: string;
	name: string;
	email: string;
	role: string;
	company: { id: string; name: string; type: string } | null;
}

interface PreOrdersClientProps {
	user: SupplierUser;
}

type PreOrderStatus = "ACTIVE" | "FINALIZED" | "REJECTED" | "EXPIRED";

interface PreOrder {
	id: string;
	status: PreOrderStatus;
	totalAmount: number;
	itemCount: number;
	totalQuantity: number;
	createdAt: string;
	respondedAt: string | null;
	client: { id: string; name: string };
	supplier: { id: string; name: string };
}

function formatCurrency(value: number): string {
	return new Intl.NumberFormat("pt-BR", {
		style: "currency",
		currency: "BRL",
	}).format(value);
}

function formatDate(value: string): string {
	return new Date(value).toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

const STATUS: Record<PreOrderStatus, { label: string; className: string }> = {
	ACTIVE: { label: "Pendente", className: "bg-primary/10 text-primary" },
	FINALIZED: { label: "Aprovado", className: "bg-success/10 text-success" },
	REJECTED: {
		label: "Rejeitado",
		className: "bg-destructive/10 text-destructive",
	},
	EXPIRED: { label: "Expirado", className: "bg-muted text-muted-foreground" },
};

export default function PreOrdersClient({ user }: PreOrdersClientProps) {
	const [orders, setOrders] = useState<PreOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [rejectId, setRejectId] = useState<string | null>(null);
	const [rejectNotes, setRejectNotes] = useState("");
	const [busy, setBusy] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		void load();
	}, []);

	async function load() {
		setLoading(true);
		try {
			const res = await fetch("/api/pre-order/list?limit=50");
			const data = (await res.json()) as {
				preOrders?: PreOrder[];
				error?: string;
			};
			if (!res.ok) throw new Error(data.error ?? "Erro ao carregar");
			setOrders(data.preOrders ?? []);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Erro ao carregar");
		} finally {
			setLoading(false);
		}
	}

	async function respond(
		ids: string[],
		action: "APPROVE" | "REJECT",
		notes?: string,
	) {
		setBusy(true);
		try {
			const res = await fetch("/api/pre-order/bulk-action", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ preOrderIds: ids, action, notes }),
			});
			const data = (await res.json()) as { message?: string; error?: string };
			if (!res.ok) throw new Error(data.error ?? "Erro");
			toast.success(data.message ?? "Pré-pedido atualizado");
			setRejectId(null);
			setRejectNotes("");
			await load();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Erro");
		} finally {
			setBusy(false);
		}
	}

	const pending = orders.filter((o) => o.status === "ACTIVE");
	const answered = orders.filter((o) => o.status !== "ACTIVE");

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Pré-pedidos recebidos</h1>
				<p className="text-muted-foreground">
					Olá {user.name} — aprove ou rejeite os pré-pedidos dos compradores.
				</p>
			</div>

			{loading ? (
				<div className="space-y-3">
					<Skeleton className="h-28 w-full" />
					<Skeleton className="h-28 w-full" />
				</div>
			) : orders.length === 0 ? (
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						<Package className="mx-auto mb-3 h-12 w-12" />
						<p>Nenhum pré-pedido recebido ainda.</p>
					</CardContent>
				</Card>
			) : (
				<>
					<section className="space-y-3">
						<h2 className="flex items-center gap-2 text-lg font-semibold">
							<Clock className="h-5 w-5 text-primary" />
							Aguardando resposta ({pending.length})
						</h2>
						{pending.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								Nenhum pré-pedido pendente.
							</p>
						) : (
							pending.map((o) => (
								<Card key={o.id}>
									<CardHeader className="pb-2">
										<CardTitle className="flex items-center justify-between text-base">
											<span>{o.client.name}</span>
											<Badge className={STATUS[o.status].className}>
												{STATUS[o.status].label}
											</Badge>
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-3">
										<div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
											<span>{o.itemCount} item(ns)</span>
											<span>{o.totalQuantity} unidade(s)</span>
											<span className="font-semibold text-foreground">
												{formatCurrency(o.totalAmount)}
											</span>
											<span>Recebido em {formatDate(o.createdAt)}</span>
										</div>
										<div className="flex gap-2">
											<Button
												size="sm"
												disabled={busy}
												onClick={() => respond([o.id], "APPROVE")}
											>
												<CheckCircle2 className="mr-1 h-4 w-4" />
												Aprovar
											</Button>
											<Button
												size="sm"
												variant="outline"
												disabled={busy}
												onClick={() => {
													setRejectId(o.id);
													setRejectNotes("");
												}}
											>
												<XCircle className="mr-1 h-4 w-4" />
												Rejeitar
											</Button>
										</div>
									</CardContent>
								</Card>
							))
						)}
					</section>

					{answered.length > 0 && (
						<section className="space-y-3">
							<h2 className="text-lg font-semibold">
								Respondidos ({answered.length})
							</h2>
							{answered.map((o) => (
								<Card key={o.id} className="opacity-80">
									<CardContent className="flex flex-wrap items-center justify-between gap-2 py-4">
										<div>
											<p className="font-medium">{o.client.name}</p>
											<p className="text-sm text-muted-foreground">
												{o.itemCount} item(ns) · {formatCurrency(o.totalAmount)}
												{o.respondedAt
													? ` · respondido em ${formatDate(o.respondedAt)}`
													: ""}
											</p>
										</div>
										<Badge className={STATUS[o.status].className}>
											{STATUS[o.status].label}
										</Badge>
									</CardContent>
								</Card>
							))}
						</section>
					)}
				</>
			)}

			<Dialog
				open={rejectId !== null}
				onOpenChange={(open) => {
					if (!open) setRejectId(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Rejeitar pré-pedido</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						Informe o motivo da rejeição (obrigatório). O comprador será
						notificado.
					</p>
					<Textarea
						placeholder="Motivo da rejeição..."
						value={rejectNotes}
						onChange={(e) => setRejectNotes(e.target.value)}
					/>
					<DialogFooter>
						<Button variant="outline" onClick={() => setRejectId(null)}>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							disabled={busy || !rejectNotes.trim()}
							onClick={() => {
								if (rejectId) respond([rejectId], "REJECT", rejectNotes.trim());
							}}
						>
							Confirmar rejeição
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
