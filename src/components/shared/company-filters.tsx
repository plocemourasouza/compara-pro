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

export interface CityOption {
	value: string;
	label: string;
}

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
	cityOptions: CityOption[];
	predicate: (company: Company) => boolean;
}

// Separador da chave composta "<estado>::<cidade>" usada em `cityOptions`
// quando stateFilter === "all" (dois nomes de cidade iguais em estados
// diferentes precisam de identidade própria — ver cityOptions abaixo). ":"
// não é um caractere válido em nome de cidade brasileira nem em UF, então a
// composição é livre de colisão e ainda dá pra ler/depurar a olho nu.
const CITY_STATE_SEPARATOR = "::";

/** Desfaz a chave composta de `cityOptions`; `state: null` = opção "plana" (sem estado). */
function parseCityOptionValue(value: string): {
	state: string | null;
	city: string;
} {
	const separatorIndex = value.indexOf(CITY_STATE_SEPARATOR);
	if (separatorIndex === -1) return { state: null, city: value };
	return {
		state: value.slice(0, separatorIndex),
		city: value.slice(separatorIndex + CITY_STATE_SEPARATOR.length),
	};
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

	const cityOptions = useMemo<CityOption[]>(() => {
		if (stateFilter !== "all") {
			// Dentro de um único estado não há ambiguidade: valor e label são o
			// nome puro da cidade, como antes.
			return Array.from(
				new Set(
					companies
						.filter((c) => c.state === stateFilter)
						.map((c) => c.city)
						.filter(Boolean) as string[],
				),
			)
				.sort((a, b) => a.localeCompare(b, "pt-BR"))
				.map((city) => ({ value: city, label: city }));
		}

		// stateFilter "all": duas cidades de mesmo nome em estados diferentes
		// (ex.: "São Paulo/SP" e "São Paulo/MG") são entidades distintas, então a
		// identidade da opção é o par estado+cidade, não só o nome. Empresa sem
		// estado cadastrado cai numa opção "plana" (dedupe só por nome), igual ao
		// comportamento anterior para esse caso residual.
		const options = new Map<string, CityOption>();
		for (const c of companies) {
			if (!c.city) continue;
			const value = c.state
				? `${c.state}${CITY_STATE_SEPARATOR}${c.city}`
				: c.city;
			if (!options.has(value)) {
				const label = c.state ? `${c.city} — ${c.state}` : c.city;
				options.set(value, { value, label });
			}
		}
		return Array.from(options.values()).sort((a, b) =>
			a.label.localeCompare(b.label, "pt-BR"),
		);
	}, [companies, stateFilter]);

	// Cidade depende do Estado: reseta se a cidade escolhida sai da lista. Isso
	// também cobre a transição stateFilter "all" → "SP": o valor composto
	// "SP::São Paulo" deixa de existir na nova lista (que passa a ter só nomes
	// planos) e o filtro cai para "all" sem precisar de um caso especial.
	useEffect(() => {
		if (
			cityFilter !== "all" &&
			!cityOptions.some((option) => option.value === cityFilter)
		) {
			setCityFilter("all");
		}
	}, [cityOptions, cityFilter]);

	const predicate = useMemo(() => {
		// `setHours` normaliza `dateRange.from`/`.to` (já em horário local) para o
		// início/fim do dia local, propositalmente — a intenção é "criado neste
		// dia no fuso do usuário", não um instante UTC fixo. Não "corrigir" isso
		// para UTC: quebraria a fronteira do dia para quem não está em UTC.
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
			if (cityFilter !== "all") {
				const parsed = parseCityOptionValue(cityFilter);
				if (c.city !== parsed.city) return false;
				if (parsed.state !== null && c.state !== parsed.state) return false;
			}
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
						<SelectItem key={city.value} value={city.value}>
							{city.label}
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
