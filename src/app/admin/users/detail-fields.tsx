"use client";

import type { DetailSection } from "@/components/shared/entity-detail-modal";
import { Badge } from "@/components/ui/badge";
import {
	formatDateTime,
	getRoleBadgeColor,
	getRoleLabel,
	type UserData,
} from "./columns";

export const userDetailSections: DetailSection<UserData>[] = [
	{
		title: "Dados do Usuário",
		fields: [
			{ label: "Nome", value: (u) => u.name },
			{ label: "Email", value: (u) => u.email },
			{ label: "Telefone", value: (u) => u.phone || "-" },
			{
				label: "Papel",
				value: (u) => (
					<Badge className={getRoleBadgeColor(u.role)}>
						{getRoleLabel(u.role)}
					</Badge>
				),
			},
			{ label: "Empresa", value: (u) => u.company?.name ?? "-" },
			{
				label: "Status",
				value: (u) => {
					if (u.deletedAt) {
						return <Badge variant="destructive">Inativo</Badge>;
					}
					if (u.pending) {
						return (
							<Badge className="border-transparent bg-amber-500/10 text-amber-600">
								Pendente
							</Badge>
						);
					}
					return <Badge variant="secondary">Ativo</Badge>;
				},
			},
			{
				label: "Criado em",
				hideWhenEmpty: false,
				value: (u) => formatDateTime(u.createdAt),
			},
			{
				label: "Atualizado em",
				hideWhenEmpty: false,
				value: (u) => formatDateTime(u.updatedAt),
			},
		],
	},
];
