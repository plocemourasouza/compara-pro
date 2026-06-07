"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
	company: { id: string; name: string; type: string } | null;
};

interface HistoryClientProps {
	user: User;
}

export default function HistoryClient({ user }: HistoryClientProps) {
	const showPriceIndicator = user.role === "REPRESENTATIVE";
	const [uploads, setUploads] = useState<Upload[]>([]);
	const [loading, setLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("all");
	const [typeFilter, setTypeFilter] = useState("all");
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

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
	};

	const openDetail = (upload: Upload) => {
		setSelectedId(upload.id);
		setDetailOpen(true);
	};

	const columns = useMemo(
		() => getUploadColumns({ showPriceIndicator }),
		[showPriceIndicator],
	);

	const filteredUploads = useMemo(
		() =>
			uploads.filter((u) => {
				const matchesStatus =
					statusFilter === "all" || u.status === statusFilter;
				const matchesType = typeFilter === "all" || u.uploadType === typeFilter;
				return matchesStatus && matchesType;
			}),
		[uploads, statusFilter, typeFilter],
	);

	return (
		<div className="space-y-6">
			<div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Histórico de Uploads
					</h1>
					<p className="text-muted-foreground">
						Acompanhe todos os uploads anteriores
					</p>
				</div>
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
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Uploads</CardTitle>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={filteredUploads}
						searchKey="fileName"
						searchPlaceholder="Nome do arquivo..."
						onRowClick={openDetail}
						isLoading={loading}
						emptyState="Nenhum upload encontrado."
						toolbar={
							<>
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-40">
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos os status</SelectItem>
										<SelectItem value="COMPLETED">Concluído</SelectItem>
										<SelectItem value="PROCESSING">Processando</SelectItem>
										<SelectItem value="FAILED">Falhou</SelectItem>
										<SelectItem value="CANCELLED">Cancelado</SelectItem>
									</SelectContent>
								</Select>
								<Select value={typeFilter} onValueChange={setTypeFilter}>
									<SelectTrigger className="w-44">
										<SelectValue placeholder="Tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">Todos os tipos</SelectItem>
										<SelectItem value="SUPPLIER_PRODUCTS">Produtos</SelectItem>
										<SelectItem value="CLIENT_REQUIREMENTS">
											Requisições
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
			/>
		</div>
	);
}
