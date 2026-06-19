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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	/** Column id used by the search box. Omit to hide the search input. */
	searchKey?: string;
	searchPlaceholder?: string;
	/** Row click handler — used to open the detail modal. */
	onRowClick?: (row: TData) => void;
	/** Client-side page size. Default 10. */
	pageSize?: number;
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
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [internalPagination, setInternalPagination] = useState<PaginationState>(
		{ pageIndex: 0, pageSize },
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

			<div className="min-h-0 flex-1 overflow-auto rounded-md border">
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
				<p className="text-sm text-muted-foreground">
					{total === 0
						? "Nenhum registro"
						: `Exibindo ${start}-${end} de ${total} registro(s)`}
				</p>
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
