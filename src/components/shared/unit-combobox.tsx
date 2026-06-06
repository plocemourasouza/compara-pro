"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Unidades de medida (código + descrição), todas em maiúsculo. */
export const MEASUREMENT_UNITS = [
	{ code: "UN", name: "UNIDADE" },
	{ code: "PC", name: "PEÇA" },
	{ code: "CX", name: "CAIXA" },
	{ code: "PCT", name: "PACOTE" },
	{ code: "FD", name: "FARDO" },
	{ code: "SC", name: "SACO" },
	{ code: "KIT", name: "KIT" },
	{ code: "JG", name: "JOGO" },
	{ code: "PAR", name: "PAR" },
	{ code: "DZ", name: "DÚZIA" },
	{ code: "CENTO", name: "CENTO" },
	{ code: "MLH", name: "MILHEIRO" },
	{ code: "KG", name: "QUILOGRAMA" },
	{ code: "G", name: "GRAMA" },
	{ code: "MG", name: "MILIGRAMA" },
	{ code: "T", name: "TONELADA" },
	{ code: "L", name: "LITRO" },
	{ code: "ML", name: "MILILITRO" },
	{ code: "M", name: "METRO" },
	{ code: "CM", name: "CENTÍMETRO" },
	{ code: "MM", name: "MILÍMETRO" },
	{ code: "KM", name: "QUILÔMETRO" },
	{ code: "M2", name: "METRO QUADRADO" },
	{ code: "M3", name: "METRO CÚBICO" },
	{ code: "RL", name: "ROLO" },
	{ code: "BOB", name: "BOBINA" },
	{ code: "GL", name: "GALÃO" },
	{ code: "FR", name: "FRASCO" },
	{ code: "TB", name: "TUBO" },
	{ code: "BD", name: "BALDE" },
	{ code: "LATA", name: "LATA" },
	{ code: "AMP", name: "AMPOLA" },
	{ code: "RESMA", name: "RESMA" },
	{ code: "FL", name: "FOLHA" },
	{ code: "BR", name: "BARRA" },
] as const;

interface UnitComboboxProps {
	value: string;
	onChange: (value: string) => void;
	id?: string;
}

export function UnitCombobox({ value, onChange, id }: UnitComboboxProps) {
	const [open, setOpen] = useState(false);
	const selected = MEASUREMENT_UNITS.find((u) => u.code === value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					id={id}
					type="button"
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between font-normal"
				>
					<span className={cn(!value && "text-muted-foreground")}>
						{selected
							? `${selected.code} — ${selected.name}`
							: value || "Selecione a unidade"}
					</span>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[var(--radix-popover-trigger-width)] p-0"
				align="start"
			>
				<Command>
					<CommandInput placeholder="Buscar unidade..." />
					<CommandList>
						<CommandEmpty>Nenhuma unidade encontrada.</CommandEmpty>
						<CommandGroup>
							{MEASUREMENT_UNITS.map((u) => (
								<CommandItem
									key={u.code}
									value={`${u.code} ${u.name}`}
									onSelect={() => {
										onChange(u.code);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											value === u.code ? "opacity-100" : "opacity-0",
										)}
									/>
									{u.code} — {u.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
