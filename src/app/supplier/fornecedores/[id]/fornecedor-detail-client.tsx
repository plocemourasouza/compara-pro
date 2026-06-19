"use client";

import {
	ArrowLeft,
	Building2,
	Package,
	Pencil,
	Trash2,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CnpjCell } from "@/components/shared/cnpj-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { formatters } from "@/lib/utils/masks";

interface ClientRow {
	id: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
}

interface SupplierDetail {
	id: string;
	name: string;
	cnpj: string | null;
	city: string | null;
	state: string | null;
	productCount: number;
	activeCatalog: { fileName: string; uploadedAt: string } | null;
	clients: ClientRow[];
}

export default function FornecedorDetailClient({
	supplierId,
}: {
	supplierId: string;
}) {
	const router = useRouter();
	const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [removing, setRemoving] = useState(false);

	useEffect(() => {
		fetch(`/api/representative/suppliers/${supplierId}`)
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.then((d) => setSupplier(d.supplier))
			.catch(() => toast.error("Não foi possível carregar o fornecedor."))
			.finally(() => setLoading(false));
	}, [supplierId]);

	const remove = async () => {
		if (!supplier) return;
		if (
			!confirm(
				`Deixar de representar ${supplier.name}? Os produtos não são apagados.`,
			)
		)
			return;
		setRemoving(true);
		const res = await fetch(`/api/representative/suppliers/${supplierId}`, {
			method: "DELETE",
		});
		if (res.ok) {
			toast.success("Fornecedor desvinculado.");
			router.push("/supplier/fornecedores");
			router.refresh();
		} else {
			toast.error("Não foi possível desvincular.");
			setRemoving(false);
		}
	};

	if (loading) {
		return <p className="text-muted-foreground text-sm">Carregando…</p>;
	}

	if (!supplier) {
		return (
			<p className="text-muted-foreground text-sm">
				Fornecedor não encontrado.
			</p>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-start gap-3">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => router.push("/supplier/fornecedores")}
					>
						<ArrowLeft className="h-4 w-4" />
					</Button>
					<div>
						<h1 className="font-bold text-2xl tracking-tight">
							{supplier.name}
						</h1>
						<div className="text-muted-foreground">
							{supplier.cnpj ? (
								<CnpjCell masked={supplier.cnpj} companyId={supplier.id} />
							) : (
								"Sem CNPJ"
							)}
							{supplier.city ? ` · ${supplier.city}` : ""}
							{supplier.state ? `/${supplier.state}` : ""}
						</div>
					</div>
				</div>
				<div className="flex shrink-0 gap-2">
					<Button asChild variant="outline">
						<Link href={`/supplier/fornecedores/${supplier.id}/editar`}>
							<Pencil className="mr-2 h-4 w-4" />
							Editar
						</Link>
					</Button>
					<Button variant="outline" onClick={remove} disabled={removing}>
						<Trash2 className="mr-2 h-4 w-4" />
						Deixar de representar
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-muted-foreground text-sm">
							Produtos no catálogo
						</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{supplier.productCount}</div>
						<Button asChild variant="link" className="h-auto p-0 text-xs">
							<Link href="/supplier/products">Ver produtos</Link>
						</Button>
					</CardContent>
				</Card>

				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Building2 className="h-5 w-5" />
							Catálogo ativo
						</CardTitle>
						<CardDescription>Lista de preços vigente.</CardDescription>
					</CardHeader>
					<CardContent>
						{supplier.activeCatalog ? (
							<div>
								<p className="font-medium text-sm">
									{supplier.activeCatalog.fileName}
								</p>
								<p className="text-muted-foreground text-xs">
									Enviado em{" "}
									{formatters.date(supplier.activeCatalog.uploadedAt)}
								</p>
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								Nenhum catálogo ativo para este fornecedor.
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-lg">
						<Users className="h-5 w-5" />
						Clientes na carteira
					</CardTitle>
					<CardDescription>
						Clientes vinculados a este fornecedor na sua carteira.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{supplier.clients.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Nenhum cliente vinculado a este fornecedor ainda.
						</p>
					) : (
						<ul className="divide-y">
							{supplier.clients.map((c) => (
								<li
									key={c.id}
									className="flex items-center justify-between gap-3 py-3"
								>
									<div className="min-w-0">
										<Link
											href={`/supplier/clients/${c.id}`}
											className="truncate font-medium text-sm hover:underline"
										>
											{c.name}
										</Link>
										<p className="text-muted-foreground text-xs">
											{c.cnpj || "Sem CNPJ"}
											{c.city ? ` · ${c.city}` : ""}
											{c.state ? `/${c.state}` : ""}
										</p>
									</div>
									<Badge variant="secondary">Carteira</Badge>
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
