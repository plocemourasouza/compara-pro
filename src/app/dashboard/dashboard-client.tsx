"use client";

import { House, Package, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
};

export default function DashboardClient({ user }: { user: User }) {
	const _formatDate = (date: Date) => {
		return new Intl.DateTimeFormat("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(date));
	};

	const _getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-yellow-100 text-yellow-800";
			case "FINALIZED":
				return "bg-green-100 text-green-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Dashboard</h1>
					<p className="text-muted-foreground">
						Bem-vindo, {user.name} - {user.company?.name}
					</p>
				</div>
				<Badge variant="outline" className="text-sm">
					{user.role === "ADMIN"
						? "Administrador"
						: user.role === "SUPPLIER"
							? "Fornecedor"
							: "Cliente"}
				</Badge>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{/* Redireciona conforme o perfil do usuário */}
				{user.role === "SUPPLIER" && redirect("/supplier")}
				{user.role === "CLIENT" && redirect("/client")}

				{user.role === "ADMIN" && (
					<>
						<Link href="/admin">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Admin</CardTitle>
									<Users className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<p className="text-xs text-muted-foreground">
										Acesse a área de administração
									</p>
								</CardContent>
							</Card>
						</Link>

						<Link href="/supplier">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Fornecedores
									</CardTitle>
									<Package className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<p className="text-xs text-muted-foreground">
										Acesse a área de fornecedores
									</p>
								</CardContent>
							</Card>
						</Link>

						<Link href="/client">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Clientes
									</CardTitle>
									<House className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<p className="text-xs text-muted-foreground">
										Acesse a área de clientes
									</p>
								</CardContent>
							</Card>
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
