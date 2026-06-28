"use client";

import {
	type ColumnDef,
	type ColumnFiltersState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	type OnChangeFn,
	type PaginationState,
	type RowSelectionState,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

/** Minimum rows kept when auto-filling the full-height table box. */
const MIN_ROWS = 5;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 500, 1000] as const;

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	/** Column id used by the search box. Omit to hide the search input. */
	searchKey?: string;
	searchPlaceholder?: string;
	/** Row click handler — used to open the detail modal. */
	onRowClick?: (row: TData) => void;
	/** Client-side page size. Default 10 (seed/minimum when auto-filling). */
	pageSize?: number;
	/**
	 * Auto-compute the page size from the full-height table box so rows fill it
	 * (no blank space before the footer). Client-side only. Default true.
	 */
	autoFillRows?: boolean;
	isLoading?: boolean;
	emptyState?: React.ReactNode;
	/** Right-aligned toolbar slot (type filter, extra actions). */
	toolbar?: React.ReactNode;
	/** Stable row id (used for selection). */
	getRowId?: (row: TData) => string;
	/** Enable the row-selection model (caller provides a select column). */
	enableRowSelection?: boolean;
	rowSelection?: RowSelectionState;
	onRowSelectionChange?: OnChangeFn<RowSelectionState>;
	/** Server-side pagination mode (admin/users). */
	manualPagination?: boolean;
	pageCount?: number;
	pagination?: PaginationState;
	onPaginationChange?: OnChangeFn<PaginationState>;
	/** Total row count for server-side pagination counter. */
	totalRows?: number;
}

export function DataTable<TData, TValue>({
	columns,
	data,
	searchKey,
	searchPlaceholder = "Buscar...",
	onRowClick,
	pageSize = 10,
	isLoading = false,
	emptyState = "Nenhum registro encontrado.",
	toolbar,
	getRowId,
	enableRowSelection = false,
	rowSelection,
	onRowSelectionChange,
	manualPagination = false,
	pageCount,
	pagination,
	onPaginationChange,
	totalRows,
	autoFillRows = true,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [internalPagination, setInternalPagination] = useState<PaginationState>(
		{ pageIndex: 0, pageSize },
	);
	const [pageSizeChoice, setPageSizeChoice] = useState<"auto" | number>(
		autoFillRows ? "auto" : pageSize,
	);

	const table = useReactTable({
		data,
		columns,
		getRowId,
		state: {
			sorting,
			columnFilters,
			pagination: manualPagination ? pagination : internalPagination,
			...(enableRowSelection ? { rowSelection: rowSelection ?? {} } : {}),
		},
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onPaginationChange: manualPagination
			? onPaginationChange
			: setInternalPagination,
		enableRowSelection,
		onRowSelectionChange,
		manualPagination,
		pageCount: manualPagination ? pageCount : undefined,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: manualPagination ? undefined : getSortedRowModel(),
		getFilteredRowModel: manualPagination ? undefined : getFilteredRowModel(),
		getPaginationRowModel: manualPagination
			? undefined
			: getPaginationRowModel(),
	});

	const searchColumn = searchKey ? table.getColumn(searchKey) : undefined;
	const rows = table.getRowModel().rows;
	const colSpan = columns.length;

	const ps = table.getState().pagination.pageSize;
	const pi = table.getState().pagination.pageIndex;
	const rowsOnPage = table.getRowModel().rows.length;
	const total = manualPagination
		? (totalRows ?? rowsOnPage)
		: table.getFilteredRowModel().rows.length;
	const start = total === 0 ? 0 : pi * ps + 1;
	const end = manualPagination
		? pi * ps + rowsOnPage
		: Math.min((pi + 1) * ps, total);

	// Auto-fill the full-height table box: pick a page size that fills the
	// available height so there is no blank space before the footer. The box is
	// flex-1 (height set by the viewport, independent of row count), so we only
	// recompute on resize. Client-side pagination only.
	const scrollRef = useRef<HTMLDivElement>(null);
	const autoFill =
		autoFillRows && !manualPagination && pageSizeChoice === "auto";
	const filteredLen = autoFill ? table.getFilteredRowModel().rows.length : 0;
	const canMeasure = autoFill && !isLoading && rows.length > 0;

	const measureFit = useCallback(() => {
		const el = scrollRef.current;
		if (!el || !canMeasure) return;
		const headH =
			el.querySelector("thead")?.getBoundingClientRect().height ?? 0;
		let rowH = 0;
		el.querySelectorAll("tbody tr").forEach((r) => {
			rowH = Math.max(rowH, r.getBoundingClientRect().height);
		});
		if (rowH <= 0) return;
		const fit = Math.max(
			MIN_ROWS,
			Math.floor((el.clientHeight - headH) / rowH),
		);
		setInternalPagination((p) => {
			if (p.pageSize === fit) return p;
			const maxIndex = Math.max(0, Math.ceil(filteredLen / fit) - 1);
			return { pageIndex: Math.min(p.pageIndex, maxIndex), pageSize: fit };
		});
	}, [canMeasure, filteredLen]);

	useEffect(() => {
		if (!autoFill) return;
		const el = scrollRef.current;
		if (!el) return;
		measureFit();
		const ro = new ResizeObserver(() => measureFit());
		ro.observe(el);
		return () => ro.disconnect();
	}, [autoFill, measureFit]);

	return (
		<div className="flex h-full min-h-0 flex-col gap-4">
			{(searchColumn || toolbar) && (
				<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
					{searchColumn ? (
						<div className="relative w-full sm:w-md sm:max-w-full">
							<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								placeholder={searchPlaceholder}
								value={(searchColumn.getFilterValue() as string) ?? ""}
								onChange={(e) => searchColumn.setFilterValue(e.target.value)}
								className="pl-9"
							/>
						</div>
					) : null}
					{toolbar ? (
						<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
							{toolbar}
						</div>
					) : null}
				</div>
			)}

			<div
				ref={scrollRef}
				className="min-h-0 flex-1 overflow-auto rounded-md border"
			>
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const canSort =
										!manualPagination && header.column.getCanSort();
									const sorted = header.column.getIsSorted();
									return (
										<TableHead
											key={header.id}
											className={canSort ? "cursor-pointer select-none" : ""}
											onClick={
												canSort
													? header.column.getToggleSortingHandler()
													: undefined
											}
										>
											{header.isPlaceholder ? null : (
												<span className="inline-flex items-center gap-1">
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{canSort &&
														(sorted === "asc" ? (
															<ArrowUp className="h-3.5 w-3.5" />
														) : sorted === "desc" ? (
															<ArrowDown className="h-3.5 w-3.5" />
														) : (
															<ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />
														))}
												</span>
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableRow>
								<TableCell
									colSpan={colSpan}
									className="h-24 text-center text-muted-foreground"
								>
									Carregando...
								</TableCell>
							</TableRow>
						) : rows.length ? (
							rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() ? "selected" : undefined}
									className={onRowClick ? "cursor-pointer" : undefined}
									onClick={
										onRowClick ? () => onRowClick(row.original) : undefined
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={colSpan}
									className="h-24 text-center text-muted-foreground"
								>
									{emptyState}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<Select
						value={
							manualPagination
								? String(ps)
								: pageSizeChoice === "auto"
									? "auto"
									: String(pageSizeChoice)
						}
						onValueChange={(v) => {
							if (manualPagination) {
								table.setPageSize(Number(v));
								return;
							}
							if (v === "auto") {
								setPageSizeChoice("auto");
								return;
							}
							const n = Number(v);
							setPageSizeChoice(n);
							setInternalPagination({ pageIndex: 0, pageSize: n });
						}}
					>
						<SelectTrigger
							className="h-9 w-22"
							aria-label="Registros por página"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{!manualPagination && (
								<SelectItem value="auto">Automático</SelectItem>
							)}
							{PAGE_SIZE_OPTIONS.map((n) => (
								<SelectItem key={n} value={String(n)}>
									{n}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<p className="text-sm text-muted-foreground">
						{total === 0
							? "Nenhum registro"
							: `Exibindo ${start}-${end} de ${total} registro(s)`}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						Anterior
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						Próxima
					</Button>
				</div>
			</div>
		</div>
	);
}
