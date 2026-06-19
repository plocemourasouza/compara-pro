"use client";

import { ArrowLeft, FileText, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	getStatusLabel,
	getStatusVariant,
} from "@/components/shared/upload-table";
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatters } from "@/lib/utils/masks";

interface ClientInfo {
	id: string;
	name: string;
	cnpj: string | null;
	email: string | null;
	phone: string | null;
	city: string | null;
	state: string | null;
}

interface Demand {
	id: string;
	fileName: string;
	status: string;
	totalRows: number;
	processedRows: number;
	errorRows: number;
	uploadedAt: string;
}

export default function ClientDetailClient({ clientId }: { clientId: string }) {
	const router = useRouter();
	const [client, setClient] = useState<ClientInfo | null>(null);
	const [demands, setDemands] = useState<Demand[]>([]);
	const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>(
		[],
	);
	const [supplierId, setSupplierId] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [removing, setRemoving] = useState(false);

	useEffect(() => {
		fetch(`/api/supplier/clients/${clientId}`)
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.then((d) => {
				setClient(d.client);
				setDemands(d.demands);
				setSuppliers(d.suppliers ?? []);
				setSupplierId(d.suppliers?.[0]?.id ?? "");
			})
			.catch(() => toast.error("Não foi possível carregar o cliente."))
			.finally(() => setLoading(false));
	}, [clientId]);

	const remove = async () => {
		const multi = suppliers.length > 1;
		if (
			!confirm(
				multi
					? "Remover este cliente da carteira do fornecedor selecionado?"
					: "Remover este cliente da sua carteira?",
			)
		)
			return;
		setRemoving(true);
		// Com vários fornecedores, remove só do selecionado; senão, de todos.
		const qs = multi && supplierId ? `?supplierCompanyId=${supplierId}` : "";
		const res = await fetch(`/api/supplier/clients/${clientId}${qs}`, {
			method: "DELETE",
		});
		setRemoving(false);
		if (res.ok) {
			toast.success("Cliente removido da carteira.");
			router.push("/supplier/clients");
		} else {
			toast.error("Não foi possível remover.");
		}
	};

	if (loading) {
		return <p className="text-muted-foreground text-sm">Carregando…</p>;
	}
	if (!client) {
		return (
			<p className="text-muted-foreground text-sm">Cliente não encontrado.</p>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/supplier/clients")}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-2xl tracking-tight">{client.name}</h1>
						<p className="text-muted-foreground">
							{client.cnpj || "Sem CNPJ"}
							{client.city ? ` · ${client.city}` : ""}
							{client.state ? `/${client.state}` : ""}
						</p>
						{(client.email || client.phone) && (
							<p className="text-muted-foreground text-sm">
								{[
									client.email,
									client.phone ? formatters.phone(client.phone) : null,
								]
									.filter(Boolean)
									.join(" · ")}
							</p>
						)}
					</div>
				</div>
				<Button variant="outline" onClick={remove} disabled={removing}>
					<Trash2 className="mr-2 h-4 w-4" />
					Remover da carteira
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Listas de demanda</CardTitle>
					<CardDescription>
						Demandas enviadas pelo cliente. Veja as indicações do catálogo do
						fornecedor selecionado.
					</CardDescription>
					{suppliers.length > 1 && (
						<div className="pt-2">
							<Select value={supplierId} onValueChange={setSupplierId}>
								<SelectTrigger className="w-64">
									<SelectValue placeholder="Fornecedor" />
								</SelectTrigger>
								<SelectContent>
									{suppliers.map((s) => (
										<SelectItem key={s.id} value={s.id}>
											{s.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					)}
				</CardHeader>
				<CardContent>
					{demands.length === 0 ? (
						<div className="py-10 text-center text-muted-foreground text-sm">
							<FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />O cliente
							ainda não enviou listas de demanda.
						</div>
					) : (
						<ul className="divide-y">
							{demands.map((d) => (
								<li
									key={d.id}
									className="flex items-center justify-between gap-3 py-3"
								>
									<div className="min-w-0">
										<p className="truncate font-medium text-sm">{d.fileName}</p>
										<p className="text-muted-foreground text-xs">
											{d.totalRows} itens · {formatters.date(d.uploadedAt)}
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-3">
										<Badge variant={getStatusVariant(d.status)}>
											{getStatusLabel(d.status)}
										</Badge>
										<Button
											size="sm"
											disabled={d.status !== "COMPLETED"}
											onClick={() =>
												router.push(
													`/supplier/clients/${clientId}/indicacoes/${d.id}${
														supplierId ? `?supplierCompanyId=${supplierId}` : ""
													}`,
												)
											}
										>
											<Sparkles className="mr-2 h-4 w-4" />
											Ver indicações
										</Button>
									</div>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
