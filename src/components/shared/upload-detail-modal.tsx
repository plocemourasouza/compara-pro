"use client";

import { Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	formatFileSize,
	getStatusLabel,
	getStatusVariant,
	getUploadTypeLabel,
	type UploadDetail,
} from "@/components/shared/upload-table";
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
import { Progress } from "@/components/ui/progress";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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
	const [loadError, setLoadError] = useState(false);
	const [reprocessing, setReprocessing] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: fetch when modal opens for an id
	useEffect(() => {
		if (!open || !uploadId) {
			setDetail(null);
			setLoadError(false);
			return;
		}
		fetchDetail(uploadId);
	}, [open, uploadId]);

	const fetchDetail = async (id: string) => {
		setLoading(true);
		setLoadError(false);
		try {
			const response = await fetch(`/api/upload/${id}/detail`);
			if (!response.ok) {
				const message =
					response.status === 404
						? "Registro não encontrado (a lista pode estar desatualizada)."
						: "Não foi possível carregar os detalhes.";
				setLoadError(true);
				toast.error(message);
				return;
			}
			const data = await response.json();
			setDetail(data.upload);
		} catch (error) {
			console.error("Erro ao carregar detalhes:", error);
			setLoadError(true);
			toast.error("Não foi possível carregar os detalhes.");
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

	const successRateValue =
		detail && detail.totalRows > 0
			? (detail.processedRows / detail.totalRows) * 100
			: 0;
	const successRate = successRateValue.toFixed(1);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[60vh] w-[40vw] max-w-[40vw] flex-col gap-0 overflow-hidden p-0 sm:max-w-[40vw]">
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle>Detalhes do Upload</DialogTitle>
					<DialogDescription className="sr-only">
						Informações e estatísticas do arquivo enviado.
					</DialogDescription>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
					{loading ? (
						<div className="flex items-center justify-center p-8">
							<Clock className="h-8 w-8 animate-spin text-primary" />
						</div>
					) : loadError ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							Não foi possível carregar os detalhes deste upload. A lista pode
							estar desatualizada — atualize a página e tente novamente.
						</div>
					) : detail ? (
						<div className="space-y-7">
							<div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
								<section className="space-y-3">
									<h4 className="text-sm font-semibold text-foreground">
										Informações Gerais
									</h4>
									<dl className="space-y-2.5">
										<Info label="Arquivo" value={detail.fileName} />
										<Info
											label="Tipo"
											value={getUploadTypeLabel(detail.uploadType)}
										/>
										<Info
											label="Tamanho"
											value={formatFileSize(detail.fileSize)}
										/>
										<Info
											label="Status"
											value={
												<Badge variant={getStatusVariant(detail.status)}>
													{getStatusLabel(detail.status)}
												</Badge>
											}
										/>
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
								</section>
								<section className="space-y-3">
									<h4 className="text-sm font-semibold text-foreground">
										Estatísticas
									</h4>
									<div className="grid grid-cols-3 gap-2">
										<Stat label="Total" value={detail.totalRows} />
										<Stat
											label="Processadas"
											value={detail.processedRows}
											tone="success"
										/>
										<Stat
											label="Com erro"
											value={detail.errorRows}
											tone={detail.errorRows > 0 ? "destructive" : "muted"}
										/>
									</div>
									<div className="space-y-1.5 rounded-lg border bg-muted/30 p-3">
										<div className="flex items-baseline justify-between">
											<span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
												Taxa de sucesso
											</span>
											<span
												className={`text-sm font-semibold tabular-nums ${
													detail.errorRows > 0
														? "text-foreground"
														: "text-success"
												}`}
											>
												{successRate}%
											</span>
										</div>
										<Progress value={successRateValue} />
									</div>
								</section>
							</div>

							{detail.products && detail.products.length > 0 ? (
								<section className="space-y-3">
									<h4 className="text-sm font-semibold text-foreground">
										Produtos (primeiros 10)
									</h4>
									<div className="overflow-hidden rounded-lg border">
										<Table>
											<TableHeader>
												<TableRow className="bg-muted hover:bg-muted">
													<TableHead>SKU</TableHead>
													<TableHead>Nome</TableHead>
													<TableHead className="text-right">Preço</TableHead>
													<TableHead>Categoria</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{detail.products.slice(0, 10).map((product) => (
													<TableRow key={product.id}>
														<TableCell className="font-mono text-xs text-muted-foreground">
															{product.sku || product.code || "—"}
														</TableCell>
														<TableCell className="font-medium">
															{product.name}
														</TableCell>
														<TableCell className="text-right tabular-nums">
															{product.price
																? formatters.currency(product.price)
																: "—"}
														</TableCell>
														<TableCell className="text-muted-foreground">
															{product.category || "—"}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
									{detail.products.length > 10 && (
										<p className="text-xs text-muted-foreground">
											E mais {detail.products.length - 10} produtos...
										</p>
									)}
								</section>
							) : (
								<p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
									Nenhum produto importado neste upload.
								</p>
							)}

							{detail.errors && detail.errors.length > 0 && (
								<section className="space-y-3">
									<h4 className="text-sm font-semibold text-destructive">
										Erros Encontrados
									</h4>
									<div className="max-h-40 overflow-y-auto overflow-hidden rounded-lg border border-destructive/30">
										<Table>
											<TableHeader>
												<TableRow className="bg-destructive/10 hover:bg-destructive/10">
													<TableHead className="w-20 text-right">
														Linha
													</TableHead>
													<TableHead>Erro</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{detail.errors.map((err) => (
													<TableRow key={err.row}>
														<TableCell className="text-right tabular-nums text-muted-foreground">
															{err.row}
														</TableCell>
														<TableCell className="whitespace-normal text-destructive">
															{err.error}
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</div>
								</section>
							)}
						</div>
					) : null}
				</div>

				<DialogFooter className="border-t px-6 py-4">
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
		<div className="flex items-center justify-between gap-4">
			<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</dt>
			<dd className="text-right text-sm font-medium text-foreground">
				{value}
			</dd>
		</div>
	);
}

function Stat({
	label,
	value,
	tone = "default",
}: {
	label: string;
	value: React.ReactNode;
	tone?: "default" | "success" | "destructive" | "muted";
}) {
	const toneClass =
		tone === "success"
			? "text-success"
			: tone === "destructive"
				? "text-destructive"
				: tone === "muted"
					? "text-muted-foreground"
					: "text-foreground";
	return (
		<div className="rounded-lg border bg-muted/30 px-2.5 py-2 text-center">
			<div className={`text-lg font-semibold tabular-nums ${toneClass}`}>
				{value}
			</div>
			<div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
				{label}
			</div>
		</div>
	);
}
