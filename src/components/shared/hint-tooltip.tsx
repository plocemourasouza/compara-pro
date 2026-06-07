"use client";

import type { ReactNode } from "react";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

interface HintTooltipProps {
	/** Linha principal (ação). */
	label: string;
	/** Linha secundária opcional (explicação). */
	description?: string;
	/** Atalho de teclado opcional, ex.: "⌘K". */
	shortcut?: string;
	side?: "top" | "right" | "bottom" | "left";
	children: ReactNode;
}

/**
 * Tooltip elaborado: título em destaque + descrição/atalho opcionais.
 * Envolve qualquer trigger (asChild) — ideal para botões icon-only e badges.
 */
export function HintTooltip({
	label,
	description,
	shortcut,
	side = "top",
	children,
}: HintTooltipProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent side={side} sideOffset={6} className="max-w-xs">
				<div className="flex items-center gap-2">
					<span className="font-medium">{label}</span>
					{shortcut && (
						<kbd className="rounded bg-primary-foreground/15 px-1.5 py-0.5 text-[10px] font-mono">
							{shortcut}
						</kbd>
					)}
				</div>
				{description && (
					<p className="mt-0.5 text-[11px] leading-snug text-primary-foreground/70">
						{description}
					</p>
				)}
			</TooltipContent>
		</Tooltip>
	);
}
