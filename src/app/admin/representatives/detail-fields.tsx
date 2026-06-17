"use client";

import { Building2, User } from "lucide-react";
import { CnpjCell } from "@/components/shared/cnpj-cell";
import type { DetailSection } from "@/components/shared/entity-detail-modal";
import { formatters } from "@/lib/utils/masks";
import { type Company, getTaxRegimeLabel } from "../companies/columns";

/**
 * Seções da modal de detalhe do Representante. Difere de Empresas:
 *  - sem "Tipo" (sempre Representante — redundante; o título já indica);
 *  - sem seção de Estatísticas;
 *  - Responsável + Localização fundidos numa seção;
 *  - grids em 3 colunas para caber sem rolagem.
 */
export const representativeDetailSections: DetailSection<Company>[] = [
	{
		title: "Dados da Empresa",
		icon: <Building2 className="h-4 w-4" />,
		cols: 3,
		fields: [
			{ label: "Nome Fantasia", value: (c) => c.name },
			{ label: "Razão Social", value: (c) => c.legalName },
			{
				// CNPJ chega anonimizado (LGPD); CnpjCell revela sob demanda.
				label: "CNPJ",
				value: (c) =>
					c.cnpj ? <CnpjCell masked={c.cnpj} companyId={c.id} /> : "",
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
		title: "Responsável e Localização",
		icon: <User className="h-4 w-4" />,
		cols: 3,
		fields: [
			{ label: "Responsável", value: (c) => c.responsibleName },
			{ label: "E-mail do Responsável", value: (c) => c.responsibleEmail },
			{
				label: "Telefone do Responsável",
				value: (c) =>
					c.responsiblePhone ? formatters.phone(c.responsiblePhone) : "",
			},
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
			{ label: "Referência", full: true, value: (c) => c.addressReference },
		],
	},
];
