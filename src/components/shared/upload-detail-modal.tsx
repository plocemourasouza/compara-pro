"use client";

import { Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	formatFileSize,
	getStatusLabel,
	getUploadTypeLabel,
	type UploadDetail,
} from "@/components/shared/upload-table";
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
import { formatters } from "@/lib/utils/masks";

interface UploadDetailModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	uploadId: string | null;
	/** Show the Reprocessar action for FAILED uploads. */
	canReprocess?: boolean;
	/** Called after a successful reprocess so the list can refresh. */
	onReprocessed?: () => void;
}

export function UploadDetailModal({
	open,
	onOpenChange,
	uploadId,
	canReprocess = false,
	onReprocessed,
}: UploadDetailModalProps) {
	const [detail, setDetail] = useState<UploadDetail | null>(null);
	const [loading, setLoading] = useState(false);
	const [reprocessing, setReprocessing] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: fetch when modal opens for an id
	useEffect(() => {
		if (!open || !uploadId) {
			setDetail(null);
			return;
		}
		fetchDetail(uploadId);
	}, [open, uploadId]);

	const fetchDetail = async (id: string) => {
		setLoading(true);
		try {
			const response = await fetch(`/api/upload/${id}/detail`);
			if (!response.ok) throw new Error("Erro ao carregar detalhes");
			const data = await response.json();
			setDetail(data.upload);
		} catch (error) {
			console.error("Erro ao carregar detalhes:", error);
			toast.error("Erro ao carregar detalhes do upload");
		} finally {
			setLoading(false);
		}
	};

	const handleReprocess = async () => {
		if (!uploadId) return;
		setReprocessing(true);
		try {
			const response = await fetch(`/api/upload/${uploadId}/reprocess`, {
				method: "POST",
			});
			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Erro ao reprocessar upload");
			}
			toast.success("Upload enviado para reprocessamento");
			onReprocessed?.();
			onOpenChange(false);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Erro ao reprocessar",
			);
		} finally {
			setReprocessing(false);
		}
	};

	const successRate =
		detail && detail.totalRows > 0
			? ((detail.processedRows / detail.totalRows) * 100).toFixed(1)
			: "0";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Detalhes do Upload</DialogTitle>
					<DialogDescription className="sr-only">
						Informações e estatísticas do arquivo enviado.
					</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex items-center justify-center p-8">
						<Clock className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : detail ? (
					<div className="space-y-6">
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div className="space-y-2">
								<h4 className="font-semibold">Informações Gerais</h4>
								<dl className="space-y-1 text-sm">
									<Info label="Arquivo" value={detail.fileName} />
									<Info
										label="Tipo"
										value={getUploadTypeLabel(detail.uploadType)}
									/>
									<Info
										label="Tamanho"
										value={formatFileSize(detail.fileSize)}
									/>
									<Info label="Status" value={getStatusLabel(detail.status)} />
									<Info
										label="Upload"
										value={formatters.datetime(detail.uploadedAt)}
									/>
									{detail.processedAt && (
										<Info
											label="Processado"
											value={formatters.datetime(detail.processedAt)}
										/>
									)}
								</dl>
							</div>
							<div className="space-y-2">
								<h4 className="font-semibold">Estatísticas</h4>
								<dl className="space-y-1 text-sm">
									<Info label="Total de linhas" value={detail.totalRows} />
									<Info label="Processadas" value={detail.processedRows} />
									<Info label="Com erro" value={detail.errorRows} />
									<Info label="Taxa de sucesso" value={`${successRate}%`} />
								</dl>
							</div>
						</div>

						{detail.products && detail.products.length > 0 && (
							<div>
								<h4 className="mb-2 font-semibold">Produtos (primeiros 10)</h4>
								<div className="overflow-hidden rounded-lg border">
									<table className="w-full text-sm">
										<thead className="bg-muted">
											<tr>
												<th className="px-3 py-2 text-left">SKU</th>
												<th className="px-3 py-2 text-left">Nome</th>
												<th className="px-3 py-2 text-left">Preço</th>
												<th className="px-3 py-2 text-left">Categoria</th>
											</tr>
										</thead>
										<tbody>
											{detail.products.slice(0, 10).map((product) => (
												<tr key={product.id} className="border-t">
													<td className="px-3 py-2">
														{product.sku || product.code || "-"}
													</td>
													<td className="px-3 py-2">{product.name}</td>
													<td className="px-3 py-2">
														{product.price
															? formatters.currency(product.price)
															: "-"}
													</td>
													<td className="px-3 py-2">
														{product.category || "-"}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
								{detail.products.length > 10 && (
									<p className="mt-2 text-sm text-muted-foreground">
										E mais {detail.products.length - 10} produtos...
									</p>
								)}
							</div>
						)}

						{detail.errors && detail.errors.length > 0 && (
							<div>
								<h4 className="mb-2 font-semibold">Erros Encontrados</h4>
								<div className="max-h-40 overflow-y-auto overflow-hidden rounded-lg border">
									<table className="w-full text-sm">
										<thead className="bg-destructive/10">
											<tr>
												<th className="px-3 py-2 text-left">Linha</th>
												<th className="px-3 py-2 text-left">Erro</th>
											</tr>
										</thead>
										<tbody>
											{detail.errors.map((err) => (
												<tr key={err.row} className="border-t">
													<td className="px-3 py-2">{err.row}</td>
													<td className="px-3 py-2">{err.error}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>
				) : null}

				<DialogFooter>
					<DialogClose asChild>
						<Button variant="outline">Fechar</Button>
					</DialogClose>
					{canReprocess && detail?.status === "FAILED" && (
						<Button onClick={handleReprocess} disabled={reprocessing}>
							<RefreshCw
								className={`mr-2 h-4 w-4 ${reprocessing ? "animate-spin" : ""}`}
							/>
							{reprocessing ? "Reprocessando..." : "Reprocessar"}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div className="flex justify-between gap-4">
			<dt className="text-muted-foreground">{label}</dt>
			<dd className="text-right font-medium">{value}</dd>
		</div>
	);
}
