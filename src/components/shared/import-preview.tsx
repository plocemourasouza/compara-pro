"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { HeaderMapping } from "@/lib/file-mapping";
import { applyMapping, SUPPLIER_FIELDS } from "@/lib/file-mapping";

interface ImportPreviewProps {
	rows: Record<string, unknown>[];
	mapping: HeaderMapping;
}

const PREVIEW_ROW_LIMIT = 15;

export function ImportPreview({ rows, mapping }: ImportPreviewProps) {
	const totalProducts = rows.length;
	const previewRows = useMemo(() => rows.slice(0, PREVIEW_ROW_LIMIT), [rows]);
	const noNameCount = useMemo(
		() =>
			rows.filter((row) => {
				const nameVal = applyMapping(row, mapping).name;
				return nameVal === undefined || String(nameVal).trim() === "";
			}).length,
		[rows, mapping],
	);

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-3 text-sm text-muted-foreground">
				<span>
					<span className="font-medium text-foreground">{totalProducts}</span>{" "}
					{totalProducts === 1 ? "produto detectado" : "produtos detectados"}
				</span>
				{noNameCount > 0 && (
					<Badge variant="destructive" className="text-xs">
						{noNameCount} sem nome
					</Badge>
				)}
			</div>

			<ScrollArea className="h-[280px] rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							{SUPPLIER_FIELDS.map((field) => (
								<TableHead key={field.key} className="text-xs">
									{field.label}
									{field.required && (
										<span className="text-destructive ml-0.5">*</span>
									)}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{previewRows.map((row, rowIdx) => {
							const mapped = applyMapping(row, mapping);
							const nameEmpty =
								mapped.name === undefined || String(mapped.name).trim() === "";
							const rowKey = `${String(mapped.name ?? "")}-${String(mapped.sku ?? "")}-${String(mapped.code ?? "")}-${rowIdx}`;
							return (
								<TableRow
									key={rowKey}
									className={nameEmpty ? "bg-destructive/5" : undefined}
								>
									{SUPPLIER_FIELDS.map((field) => {
										const val = mapped[field.key];
										const cellStr = val !== undefined ? String(val) : "";
										const isNameEmpty = field.key === "name" && nameEmpty;
										return (
											<TableCell key={field.key} className="text-xs">
												{isNameEmpty ? (
													<span className="text-destructive italic">
														— sem nome —
													</span>
												) : (
													cellStr
												)}
											</TableCell>
										);
									})}
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</ScrollArea>

			{rows.length > PREVIEW_ROW_LIMIT && (
				<p className="text-xs text-muted-foreground text-right">
					Mostrando {PREVIEW_ROW_LIMIT} de {rows.length} linhas
				</p>
			)}
		</div>
	);
}
