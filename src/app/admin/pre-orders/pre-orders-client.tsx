"use client";

import {
	Building2,
	Calendar,
	CheckCircle,
	Clock,
	Eye,
	Package,
	ShoppingCart,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface PreOrder {
	id: string;
	status: "ACTIVE" | "FINALIZED" | "REJECTED";
	totalAmount?: number;
	itemCount: number;
	totalQuantity: number;
	createdAt: string;
	respondedAt?: string;
	notes?: string;
	client: { id: string; name: string };
	supplier: { id: string; name: string };
}

interface PreOrdersClientProps {
	user: User;
}

export default function PreOrdersClient({ user }: PreOrdersClientProps) {
	const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
	const [loading, setLoading] = useState(true);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchPreOrders();
	}, []);

	const fetchPreOrders = async () => {
		try {
			const response = await fetch("/api/pre-order/list");

			if (response.ok) {
				const data = await response.json();
				setPreOrders(data.preOrders);
			}
		} catch (error) {
			console.error("Fetch pre-orders error:", error);
		} finally {
			setLoading(false);
		}
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return <Clock className="h-4 w-4 text-yellow-500" />;
			case "FINALIZED":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "REJECTED":
				return <XCircle className="h-4 w-4 text-red-500" />;
			default:
				return null;
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "Pendente";
			case "FINALIZED":
				return "Aprovado";
			case "REJECTED":
				return "Rejeitado";
			default:
				return status;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "ACTIVE":
				return "bg-yellow-100 text-yellow-800";
			case "FINALIZED":
				return "bg-green-100 text-green-800";
			case "REJECTED":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const formatDate = (dateString: string) => {
		return new Intl.DateTimeFormat("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(dateString));
	};

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
					<p>Carregando pré-pedidos...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">Pré-pedidos</h1>
				<p className="text-muted-foreground">
					{user.role === "CLIENT"
						? "Acompanhe seus pré-pedidos enviados aos fornecedores"
						: "Gerencie os pré-pedidos recebidos dos clientes"}
				</p>
			</div>

			{preOrders.length === 0 ? (
				<Card>
					<CardContent className="flex flex-col items-center justify-center py-16">
						<ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
						<h3 className="text-lg font-semibold text-gray-600 mb-2">
							Nenhum pré-pedido encontrado
						</h3>
						<p className="text-gray-500 text-center">
							{user.role === "CLIENT"
								? "Quando você criar pré-pedidos, eles aparecerão aqui."
								: "Quando recebermos pré-pedidos, eles aparecerão aqui."}
						</p>
					</CardContent>
				</Card>
			) : (
				<div className="grid gap-4">
					{preOrders.map((preOrder) => (
						<Card key={preOrder.id}>
							<CardHeader>
								<div className="flex justify-between items-start">
									<CardTitle className="flex items-center gap-2">
										<ShoppingCart className="h-5 w-5" />
										Pré-pedido #{preOrder.id.slice(-8)}
									</CardTitle>
									<div className="flex items-center gap-2">
										{getStatusIcon(preOrder.status)}
										<Badge className={getStatusColor(preOrder.status)}>
											{getStatusLabel(preOrder.status)}
										</Badge>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
									<div className="flex items-center gap-2">
										<Building2 className="h-4 w-4 text-gray-500" />
										<div>
											<p className="text-sm text-gray-600">
												{user.role === "CLIENT" ? "Fornecedor" : "Cliente"}
											</p>
											<p className="font-medium">
												{user.role === "CLIENT"
													? preOrder.supplier.name
													: preOrder.client.name}
											</p>
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Package className="h-4 w-4 text-gray-500" />
										<div>
											<p className="text-sm text-gray-600">Produtos</p>
											<p className="font-medium">
												{preOrder.itemCount} itens ({preOrder.totalQuantity}{" "}
												unidades)
											</p>
										</div>
									</div>

									{preOrder.totalAmount && (
										<div>
											<p className="text-sm text-gray-600">Valor Total</p>
											<p className="font-bold text-green-600">
												{formatCurrency(preOrder.totalAmount)}
											</p>
										</div>
									)}
								</div>

								<div className="flex justify-between items-center">
									<div className="flex items-center gap-1 text-sm text-gray-600">
										<Calendar className="h-4 w-4" />
										<span>Criado em {formatDate(preOrder.createdAt)}</span>
										{preOrder.respondedAt && (
											<span>
												{" "}
												• Respondido em {formatDate(preOrder.respondedAt)}
											</span>
										)}
									</div>

									<div className="flex gap-2">
										<Button variant="outline" size="sm">
											<Eye className="h-4 w-4 mr-2" />
											Ver Detalhes
										</Button>

										{user.role === "SUPPLIER" &&
											preOrder.status === "ACTIVE" && (
												<>
													<Button
														variant="outline"
														size="sm"
														className="text-red-600 hover:text-red-600"
													>
														<XCircle className="h-4 w-4 mr-2" />
														Rejeitar
													</Button>
													<Button size="sm">
														<CheckCircle className="h-4 w-4 mr-2" />
														Aprovar
													</Button>
												</>
											)}
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
