"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import type * as React from "react";
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

export interface DetailField<T> {
	label: string;
	/** Value renderer. Return a string or ReactNode. */
	value: (record: T) => React.ReactNode;
	/** Span the full width of the 2-col grid (e.g. address, description). */
	full?: boolean;
	/** Hide the field when value() returns null/undefined/"". Default true. */
	hideWhenEmpty?: boolean;
}

export interface DetailSection<T> {
	title?: string;
	icon?: React.ReactNode;
	fields: DetailField<T>[];
	/** Columns in the field grid. Default 2. */
	cols?: 2 | 3;
}

export interface EntityDetailModalProps<T> {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	record: T | null;
	title: string;
	description?: string;
	sections: DetailSection<T>[];
	/** Build the edit route. Provided → renders the "Editar" button. */
	editHref?: (record: T) => string;
	/** Custom primary action for non-cadastro lists (e.g. Aprovar, Reprocessar). */
	primaryAction?: {
		label: string;
		icon?: React.ReactNode;
		onClick: (record: T) => void;
		disabled?: boolean;
	};
}

function isEmpty(value: React.ReactNode): boolean {
	return value === null || value === undefined || value === "";
}

export function EntityDetailModal<T>({
	open,
	onOpenChange,
	record,
	title,
	description,
	sections,
	editHref,
	primaryAction,
}: EntityDetailModalProps<T>) {
	const router = useRouter();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
				<DialogHeader className="border-b px-6 py-4">
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription className={description ? undefined : "sr-only"}>
						{description ?? "Detalhes do registro selecionado."}
					</DialogDescription>
				</DialogHeader>

				<div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
					{record && (
						<div className="space-y-7">
							{sections.map((section, sectionIndex) => {
								const visibleFields = section.fields.filter((field) => {
									if (field.hideWhenEmpty === false) return true;
									return !isEmpty(field.value(record));
								});
								if (visibleFields.length === 0) return null;
								const cols = section.cols ?? 2;
								const gridClass =
									cols === 3
										? "grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3"
										: "grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2";
								const fullSpan = cols === 3 ? "sm:col-span-3" : "sm:col-span-2";
								return (
									<section
										key={section.title ?? `section-${sectionIndex}`}
										className="space-y-3"
									>
										{section.title && (
											<h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
												{section.icon && (
													<span className="text-muted-foreground [&_svg]:size-4">
														{section.icon}
													</span>
												)}
												{section.title}
											</h3>
										)}
										<dl className={gridClass}>
											{visibleFields.map((field) => (
												<div
													key={field.label}
													className={field.full ? fullSpan : undefined}
												>
													<dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
														{field.label}
													</dt>
													<dd className="mt-1 text-sm leading-relaxed text-foreground">
														{field.value(record)}
													</dd>
												</div>
											))}
										</dl>
									</section>
								);
							})}
						</div>
					)}
				</div>

				<DialogFooter className="border-t px-6 py-4">
					<DialogClose asChild>
						<Button variant="outline">Fechar</Button>
					</DialogClose>
					{record && primaryAction && (
						<Button
							onClick={() => primaryAction.onClick(record)}
							disabled={primaryAction.disabled}
						>
							{primaryAction.icon}
							{primaryAction.label}
						</Button>
					)}
					{record && editHref && (
						<Button onClick={() => router.push(editHref(record))}>
							<Pencil className="mr-2 h-4 w-4" />
							Editar
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
