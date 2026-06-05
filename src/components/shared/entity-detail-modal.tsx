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
import { Separator } from "@/components/ui/separator";

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
			<DialogContent className="h-[80vh] w-[60vw] max-w-[60vw] overflow-y-auto sm:max-w-[60vw]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription className={description ? undefined : "sr-only"}>
						{description ?? "Detalhes do registro selecionado."}
					</DialogDescription>
				</DialogHeader>

				{record && (
					<div className="space-y-6">
						{sections.map((section, sectionIndex) => {
							const visibleFields = section.fields.filter((field) => {
								if (field.hideWhenEmpty === false) return true;
								return !isEmpty(field.value(record));
							});
							if (visibleFields.length === 0) return null;
							return (
								<div
									key={section.title ?? `section-${sectionIndex}`}
									className="space-y-3"
								>
									{section.title && (
										<h3 className="flex items-center gap-2 text-base font-semibold">
											{section.icon}
											{section.title}
										</h3>
									)}
									<div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
										{visibleFields.map((field) => (
											<div
												key={field.label}
												className={field.full ? "sm:col-span-2" : undefined}
											>
												<dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
													{field.label}
												</dt>
												<dd className="mt-0.5 text-sm">
													{field.value(record)}
												</dd>
											</div>
										))}
									</div>
									{section.title &&
										sectionIndex < sections.length - 1 &&
										visibleFields.length > 0 && <Separator />}
								</div>
							);
						})}
					</div>
				)}

				<DialogFooter>
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
