"use client";

import { useEffect, useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import type { Company } from "@/app/admin/companies/columns";
import { STATUS_LABELS } from "@/components/shared/status-badge";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export interface CompanyFiltersState {
	statusFilter: string;
	setStatusFilter: (value: string) => void;
	stateFilter: string;
	setStateFilter: (value: string) => void;
	cityFilter: string;
	setCityFilter: (value: string) => void;
	dateRange: DateRange | undefined;
	setDateRange: (value: DateRange | undefined) => void;
	stateOptions: string[];
	cityOptions: string[];
	predicate: (company: Company) => boolean;
}

/**
 * Filtros reutilizáveis de empresa: Status (padrão Ativo), Estado, Cidade (em
 * cascata sobre o Estado) e Período por `createdAt`. Compartilhado entre as
 * telas de Empresas e Representantes. `predicate` aplica os 4 filtros; o filtro
 * de Tipo (exclusivo de Empresas) fica fora daqui.
 */
export function useCompanyFilters(companies: Company[]): CompanyFiltersState {
	const [statusFilter, setStatusFilter] = useState<string>("ACTIVE");
	const [stateFilter, setStateFilter] = useState<string>("all");
	const [cityFilter, setCityFilter] = useState<string>("all");
	const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

	const stateOptions = useMemo(
		() =>
			Array.from(
				new Set(companies.map((c) => c.state).filter(Boolean) as string[]),
			).sort((a, b) => a.localeCompare(b, "pt-BR")),
		[companies],
	);

	const cityOptions = useMemo(
		() =>
			Array.from(
				new Set(
					companies
						.filter((c) => stateFilter === "all" || c.state === stateFilter)
						.map((c) => c.city)
						.filter(Boolean) as string[],
				),
			).sort((a, b) => a.localeCompare(b, "pt-BR")),
		[companies, stateFilter],
	);

	// Cidade depende do Estado: reseta se a cidade escolhida sai da lista
	useEffect(() => {
		if (cityFilter !== "all" && !cityOptions.includes(cityFilter)) {
			setCityFilter("all");
		}
	}, [cityOptions, cityFilter]);

	const predicate = useMemo(() => {
		const fromTime = dateRange?.from
			? new Date(dateRange.from).setHours(0, 0, 0, 0)
			: null;
		const toTime = dateRange?.to
			? new Date(dateRange.to).setHours(23, 59, 59, 999)
			: null;
		return (c: Company) => {
			if (statusFilter !== "all" && (c.status ?? "ACTIVE") !== statusFilter)
				return false;
			if (stateFilter !== "all" && c.state !== stateFilter) return false;
			if (cityFilter !== "all" && c.city !== cityFilter) return false;
			if (fromTime !== null || toTime !== null) {
				const created = new Date(c.createdAt).getTime();
				if (fromTime !== null && created < fromTime) return false;
				if (toTime !== null && created > toTime) return false;
			}
			return true;
		};
	}, [statusFilter, stateFilter, cityFilter, dateRange]);

	return {
		statusFilter,
		setStatusFilter,
		stateFilter,
		setStateFilter,
		cityFilter,
		setCityFilter,
		dateRange,
		setDateRange,
		stateOptions,
		cityOptions,
		predicate,
	};
}

interface CompanyFilterControlsProps extends CompanyFiltersState {
	/** Filtro extra renderizado após Status (ex.: Tipo, exclusivo de Empresas). */
	leadingFilter?: React.ReactNode;
}

/** Controles de filtro: Status → [leadingFilter] → Estado → Cidade → Período. */
export function CompanyFilterControls({
	statusFilter,
	setStatusFilter,
	stateFilter,
	setStateFilter,
	cityFilter,
	setCityFilter,
	dateRange,
	setDateRange,
	stateOptions,
	cityOptions,
	leadingFilter,
}: CompanyFilterControlsProps) {
	return (
		<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
			<Select value={statusFilter} onValueChange={setStatusFilter}>
				<SelectTrigger className="w-full sm:w-[150px]">
					<SelectValue placeholder="Status" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todos</SelectItem>
					<SelectItem value="ACTIVE">{STATUS_LABELS.ACTIVE}</SelectItem>
					<SelectItem value="BLOCKED">{STATUS_LABELS.BLOCKED}</SelectItem>
					<SelectItem value="INACTIVE">{STATUS_LABELS.INACTIVE}</SelectItem>
				</SelectContent>
			</Select>
			{leadingFilter}
			<Select value={stateFilter} onValueChange={setStateFilter}>
				<SelectTrigger className="w-full sm:w-[170px]">
					<SelectValue placeholder="Estado" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todos os estados</SelectItem>
					{stateOptions.map((uf) => (
						<SelectItem key={uf} value={uf}>
							{uf}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Select value={cityFilter} onValueChange={setCityFilter}>
				<SelectTrigger className="w-full sm:w-[170px]">
					<SelectValue placeholder="Cidade" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">Todas as cidades</SelectItem>
					{cityOptions.map((city) => (
						<SelectItem key={city} value={city}>
							{city}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<DatePickerWithRange
				date={dateRange}
				setDate={setDateRange}
				className="w-full sm:w-[240px]"
			/>
		</div>
	);
}
