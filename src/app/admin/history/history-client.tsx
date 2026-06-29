"use client";

import {
	DollarSign,
	ListChecks,
	Package,
	RefreshCw,
	Upload as UploadIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ProductImportDialog } from "@/components/shared/product-import-dialog";
import { UploadDetailModal } from "@/components/shared/upload-detail-modal";
import {
	getUploadColumns,
	type Upload,
} from "@/components/shared/upload-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { formatters } from "@/lib/utils/masks";

type User = {
	id: string;
	name: string;
	email: string;
	area: string;
	company: { id: string; name: string; type: string } | null;
};

interface HistoryClientProps {
	user: User;
	suppliers: { id: string; name: string }[];
}

export default function HistoryClient({ user, suppliers }: HistoryClientProps) {
	const [uploads, setUploads] = useState<Upload[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);
	const [importOpen, setImportOpen] = useState(false);
	const [stats, setStats] = useState<{
		activeLists: number;
		products: number;
		totalValue: number;
	} | null>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchHistory();
	}, []);

	const fetchHistory = async () => {
		try {
			setLoading(true);
			const response = await fetch("/api/upload/history");
			if (!response.ok) throw new Error("Erro ao carregar histórico");
			const data = await response.json();
			setUploads(data.uploads ?? []);
		} catch (error) {
			console.error("Erro ao carregar histórico:", error);
		} finally {
			setLoading(false);
		}
		try {
			const res = await fetch("/api/upload/history/stats");
			if (res.ok) setStats(await res.json());
		} catch {
			// indicadores são best-effort; ignora falha
		}
	};

	const openDetail = (upload: Upload) => {
		setSelectedId(upload.id);
		setDetailOpen(true);
	};

	const columns = useMemo(
		() => getUploadColumns({ showCompany: true, priceListMode: true }),
		[],
	);

	const filteredUploads = useMemo(
		() =>
			uploads.filter((u) => {
				const matchesStatus =
					statusFilter === "all" ||
					(statusFilter === "active" ? u.isActive : !u.isActive);
				const matchesType = typeFilter === "all" || u.uploadType === typeFilter;
				return matchesStatus && matchesType;
			}),
		[uploads, statusFilter, typeFilter],
	);

	return (
		<div className="flex min-h-0 flex-1 flex-col gap-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Listas de Preço</h1>
					<p className="text-muted-foreground">
						Listas de preço enviadas pelos fornecedores
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={fetchHistory}
						disabled={loading}
					>
						<RefreshCw
							className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
						/>
						Atualizar
					</Button>
					<Button size="sm" onClick={() => setImportOpen(true)}>
						<UploadIcon className="mr-2 h-4 w-4" />
						Importar
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<StatCard
					title="Listas ativas"
					icon={ListChecks}
					value={stats ? stats.activeLists.toLocaleString("pt-BR") : "—"}
				/>
				<StatCard
					title="Produtos ativos"
					icon={Package}
					value={stats ? stats.products.toLocaleString("pt-BR") : "—"}
				/>
				<StatCard
					title="Valor total (ativos)"
					icon={DollarSign}
					value={stats ? formatters.currency(stats.totalValue) : "—"}
				/>
			</div>

			<Card className="flex min-h-0 flex-1 flex-col">
				<CardHeader>
					<CardTitle>Listas de Preço</CardTitle>
				</CardHeader>
				<CardContent className="flex min-h-0 flex-1 flex-col pt-6">
					<DataTable
						columns={columns}
						data={filteredUploads}
						searchKey="fileName"
						searchPlaceholder="Nome do arquivo..."
						onRowClick={openDetail}
						isLoading={loading}
						emptyState="Nenhuma lista encontrada."
						toolbar={
							<>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-40">
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos os status</SelectItem>
										<SelectItem value="active">Ativo</SelectItem>
										<SelectItem value="inactive">Inativo</SelectItem>
									</SelectContent>
								</Select>
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className="w-44">
										<SelectValue placeholder="Tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos os tipos</SelectItem>
										<SelectItem value="SUPPLIER_PRODUCTS">
											Produtos do Fornecedor
										</SelectItem>
										<SelectItem value="CLIENT_REQUIREMENTS">
											Requisitos do Cliente
										</SelectItem>
									</SelectContent>
								</Select>
							</>
						}
					/>
				</CardContent>
			</Card>

			<UploadDetailModal
				open={detailOpen}
				onOpenChange={setDetailOpen}
				uploadId={selectedId}
				canReprocess
				onReprocessed={fetchHistory}
				itemsBasePath="/admin/history"
			/>

			<ProductImportDialog
				open={importOpen}
				onOpenChange={setImportOpen}
				suppliers={suppliers}
				user={user}
				onImported={fetchHistory}
			/>
		</div>
	);
}
