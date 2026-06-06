"use client";

import { Building2, Clock, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { formatters } from "@/lib/utils/masks";

interface LinkedSupplier {
	id: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
	productCount: number;
	since: string;
}
interface PendingSupplier {
	requestId: string;
	id: string;
	name: string;
	cnpj: string | null;
	requestedAt: string;
}
interface AvailableSupplier {
	id: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
}

export default function SuppliersClient() {
	const [linked, setLinked] = useState<LinkedSupplier[]>([]);
	const [pending, setPending] = useState<PendingSupplier[]>([]);
	const [loading, setLoading] = useState(true);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [available, setAvailable] = useState<AvailableSupplier[]>([]);
	const [submitting, setSubmitting] = useState(false);

	const load = useCallback(() => {
		setLoading(true);
		fetch("/api/client/suppliers")
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.then((d) => {
				setLinked(d.linked);
				setPending(d.pending);
			})
			.catch(() => toast.error("Não foi possível carregar os fornecedores."))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const openDialog = async () => {
		setDialogOpen(true);
		const res = await fetch("/api/client/suppliers/available");
		if (res.ok) setAvailable((await res.json()).suppliers);
	};

	const requestSupplier = async (supplierId: string) => {
		setSubmitting(true);
		const res = await fetch("/api/client/suppliers/requests", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ supplierCompanyId: supplierId }),
		});
		setSubmitting(false);
		const data = await res.json();
		if (res.ok) {
			toast.success("Solicitação enviada ao fornecedor.");
			setDialogOpen(false);
			load();
		} else {
			toast.error(data.error || "Não foi possível solicitar.");
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Meus Fornecedores
					</h1>
					<p className="text-muted-foreground">
						Fornecedores da sua carteira — só eles entram nas comparações.
					</p>
				</div>
				<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
					<DialogTrigger asChild>
						<Button onClick={openDialog}>
							<Plus className="mr-2 h-4 w-4" />
							Solicitar fornecedor
						</Button>
					</DialogTrigger>
					<DialogContent className="p-0">
						<DialogHeader className="px-6 pt-6">
							<DialogTitle>Solicitar fornecedor</DialogTitle>
							<DialogDescription>
								Escolha um fornecedor. Ele precisa aprovar a sua entrada na
								carteira.
							</DialogDescription>
						</DialogHeader>
						<Command className="px-2 pb-2">
							<CommandInput placeholder="Buscar fornecedor..." />
							<CommandList>
								<CommandEmpty>Nenhum fornecedor disponível.</CommandEmpty>
								<CommandGroup>
									{available.map((s) => (
										<CommandItem
											key={s.id}
											value={`${s.name} ${s.cnpj ?? ""}`}
											disabled={submitting}
											onSelect={() => requestSupplier(s.id)}
										>
											<Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
											<div>
												<p className="font-medium">{s.name}</p>
												{s.cnpj && (
													<p className="text-muted-foreground text-xs">
														{formatters.cnpj(s.cnpj)}
													</p>
												)}
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</DialogContent>
				</Dialog>
			</div>

			{pending.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Clock className="h-5 w-5 text-amber-500" />
							Aguardando aprovação
						</CardTitle>
						<CardDescription>
							Solicitações enviadas que o fornecedor ainda não respondeu.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className="divide-y">
							{pending.map((p) => (
								<li
									key={p.requestId}
									className="flex items-center justify-between py-3"
								>
									<div>
										<p className="font-medium text-sm">{p.name}</p>
										<p className="text-muted-foreground text-xs">
											Solicitado em {formatters.date(p.requestedAt)}
										</p>
									</div>
									<Badge variant="secondary">Pendente</Badge>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Vinculados</CardTitle>
					<CardDescription>
						{linked.length} fornecedor(es) na sua carteira.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-muted-foreground text-sm">Carregando…</p>
					) : linked.length === 0 ? (
						<div className="py-10 text-center text-muted-foreground text-sm">
							<Building2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
							Nenhum fornecedor ainda. Solicite o primeiro para comparar preços.
						</div>
					) : (
						<ul className="divide-y">
							{linked.map((s) => (
								<li
									key={s.id}
									className="flex items-center justify-between py-3"
								>
									<div>
										<p className="font-medium text-sm">{s.name}</p>
										<p className="text-muted-foreground text-xs">
											{s.cnpj ? formatters.cnpj(s.cnpj) : "Sem CNPJ"}
											{s.city ? ` · ${s.city}` : ""}
											{s.state ? `/${s.state}` : ""}
										</p>
									</div>
									<Badge variant="outline">{s.productCount} produtos</Badge>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
