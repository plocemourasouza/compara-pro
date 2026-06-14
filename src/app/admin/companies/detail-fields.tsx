"use client";

import { Building2, MapPin, User } from "lucide-react";
import type { DetailSection } from "@/components/shared/entity-detail-modal";
import { Badge } from "@/components/ui/badge";
import { formatters } from "@/lib/utils/masks";
import {
	type Company,
	getTaxRegimeLabel,
	getTypeBadgeColor,
	getTypeLabel,
} from "./columns";

export const companyDetailSections: DetailSection<Company>[] = [
	{
		title: "Dados da Empresa",
		icon: <Building2 className="h-4 w-4" />,
		fields: [
			{ label: "Nome Fantasia", value: (c) => c.name },
			{ label: "Razão Social", value: (c) => c.legalName },
			{
				// CNPJ pode chegar anonimizado (LGPD) para representantes — nesse caso
				// exibe como está; senão formata o valor completo.
				label: "CNPJ",
				value: (c) =>
					c.cnpj
						? c.cnpj.includes("*")
							? c.cnpj
							: formatters.cnpj(c.cnpj)
						: "",
			},
			{
				label: "Tipo",
				value: (c) => (
					<Badge className={getTypeBadgeColor(c.type)}>
						{getTypeLabel(c.type)}
					</Badge>
				),
			},
			{
				label: "Enquadramento Tributário",
				value: (c) => (c.taxRegime ? getTaxRegimeLabel(c.taxRegime) : ""),
			},
			{ label: "E-mail da Empresa", value: (c) => c.email },
			{
				label: "Telefone da Empresa",
				value: (c) => (c.phone ? formatters.phone(c.phone) : ""),
			},
		],
	},
	{
		title: "Dados do Responsável",
		icon: <User className="h-4 w-4" />,
		fields: [
			{ label: "Nome", value: (c) => c.responsibleName },
			{ label: "E-mail", value: (c) => c.responsibleEmail },
			{
				label: "Telefone",
				value: (c) =>
					c.responsiblePhone ? formatters.phone(c.responsiblePhone) : "",
			},
		],
	},
	{
		title: "Dados de Localização",
		icon: <MapPin className="h-4 w-4" />,
		fields: [
			{
				label: "Endereço",
				full: true,
				value: (c) =>
					c.street && c.number
						? `${c.addressType ?? ""} ${c.street}, ${c.number}`.trim()
						: "",
			},
			{ label: "Bairro", value: (c) => c.neighborhood },
			{
				label: "Cidade / Estado",
				value: (c) =>
					c.city && c.state ? `${c.city}, ${c.state}` : c.city || "",
			},
			{
				label: "CEP",
				value: (c) => (c.zipCode ? formatters.cep(c.zipCode) : ""),
			},
			{ label: "Referência", value: (c) => c.addressReference, full: true },
		],
	},
	{
		title: "Estatísticas",
		fields: [
			{
				label: "Usuários",
				hideWhenEmpty: false,
				value: (c) => c._count?.users ?? c.users?.length ?? 0,
			},
			{
				label: "Produtos",
				hideWhenEmpty: false,
				value: (c) => c._count?.products ?? c.products?.length ?? 0,
			},
			{
				label: "Criado em",
				hideWhenEmpty: false,
				value: (c) => formatters.date(c.createdAt),
			},
		],
	},
];
