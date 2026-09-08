"use client";

import {
	ArrowLeft,
	Building2,
	FileText,
	Pencil,
	Sparkles,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	getStatusLabel,
	getStatusVariant,
} from "@/components/shared/upload-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { formatters } from "@/lib/utils/masks";

interface ClientInfo {
	id: string;
	name: string;
	legalName: string | null;
	cnpj: string | null;
	email: string | null;
	phone: string | null;
	zipCode: string | null;
	street: string | null;
	number: string | null;
	neighborhood: string | null;
	city: string | null;
	state: string | null;
	responsibleName: string | null;
	responsibleEmail: string | null;
	responsiblePhone: string | null;
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

function Field({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
		</div>
	);
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

	const addressLine = [client.street, client.number].filter(Boolean).join(", ");
	const cityLine = [client.city, client.state].filter(Boolean).join("/");

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/supplier/clients")}
						aria-label="Voltar"
					>
						<ArrowLeft className="h-4 w-4" aria-hidden="true" />
					</Button>
					<div>
						<h1 className="font-bold text-2xl tracking-tight">{client.name}</h1>
						<p className="text-muted-foreground text-sm">
							{client.cnpj || "Sem CNPJ"}
							{client.city ? ` · ${client.city}` : ""}
							{client.state ? `/${client.state}` : ""}
						</p>
					</div>
				</div>
				<div className="flex shrink-0 gap-2">
					<Button
						variant="outline"
						onClick={() => router.push(`/supplier/clients/${clientId}/editar`)}
					>
						<Pencil className="mr-2 h-4 w-4" />
						Editar
					</Button>
					<Button variant="outline" onClick={remove} disabled={removing}>
						<Trash2 className="mr-2 h-4 w-4" />
						Remover da carteira
					</Button>
				</div>
			</div>

			{/* Cadastro */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Cadastro</CardTitle>
				</CardHeader>
				<CardContent>
					<dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
						<Field label="CNPJ" value={client.cnpj} />
						<Field label="Razão social" value={client.legalName} />
						<Field label="Responsável" value={client.responsibleName} />
						<Field label="Endereço" value={addressLine} />
						<Field label="Bairro" value={client.neighborhood} />
						<Field
							label="CEP"
							value={client.zipCode ? formatters.cep(client.zipCode) : null}
						/>
						<Field label="Cidade / UF" value={cityLine} />
						<Field
							label="E-mail"
							value={
								client.email ? (
									<a
										href={`mailto:${client.email}`}
										className="text-primary hover:underline"
									>
										{client.email}
									</a>
								) : null
							}
						/>
						<Field
							label="Telefone"
							value={
								client.phone ? (
									<a
										href={`tel:${client.phone}`}
										className="text-primary hover:underline"
									>
										{formatters.phone(client.phone)}
									</a>
								) : null
							}
						/>
					</dl>
				</CardContent>
			</Card>

			{/* Listas de demanda */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Listas de demanda</CardTitle>
					<p className="text-muted-foreground text-sm">
						Demandas enviadas pelo cliente. Veja as indicações do catálogo do
						fornecedor selecionado.
					</p>
					<div className="flex flex-wrap items-center gap-2 pt-2">
						{suppliers.length > 1 ? (
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
						) : (
							suppliers[0] && (
								<Badge variant="outline" className="gap-1">
									<Building2 className="h-3 w-3" />
									{suppliers[0].name}
								</Badge>
							)
						)}
						<span className="text-muted-foreground text-xs">
							{demands.length} lista(s)
						</span>
					</div>
				</CardHeader>
				<CardContent>
					{demands.length === 0 ? (
						<div className="py-10 text-center text-muted-foreground text-sm">
							<FileText className="mx-auto mb-2 h-8 w-8 opacity-40" />O cliente
							ainda não enviou listas de demanda.
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Arquivo</TableHead>
									<TableHead className="text-right">Itens</TableHead>
									<TableHead>Data</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{demands.map((d) => (
									<TableRow key={d.id}>
										<TableCell>
											<div className="flex min-w-0 items-center gap-3">
												<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
													<FileText className="h-4 w-4" />
												</div>
												<span className="truncate font-medium">
													{d.fileName}
												</span>
											</div>
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{d.totalRows}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{formatters.date(d.uploadedAt)}
										</TableCell>
										<TableCell>
											<Badge variant={getStatusVariant(d.status)}>
												{getStatusLabel(d.status)}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<Button
												size="sm"
												disabled={d.status !== "COMPLETED"}
												onClick={() =>
													router.push(
														`/supplier/clients/${clientId}/indicacoes/${d.id}${
															supplierId
																? `?supplierCompanyId=${supplierId}`
																: ""
														}`,
													)
												}
											>
												<Sparkles className="mr-2 h-4 w-4" />
												Ver indicações
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
