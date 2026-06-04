import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import PreOrderModal from "@/components/dashboard/PreOrderModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface PreOrder {
	id: string;
	status: "ACTIVE" | "FINALIZED";
	createdAt: string;
	items: {
		id: string;
		product: {
			code?: string;
			sku?: string;
			name: string;
		};
		price: number;
	}[];
}

export default function PreOrdersPage() {
	const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
	const [selectedPreOrder, setSelectedPreOrder] = useState<PreOrder | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchPreOrders = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				router.push("/auth/login");
				return;
			}

			try {
				const response = await fetch("/api/pre-orders", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setPreOrders(data);
				} else {
					router.push("/auth/login");
				}
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchPreOrders();
	}, [router]);

	const handleFinalize = async (id: string) => {
		const token = localStorage.getItem("token");
		if (!token) {
			router.push("/auth/login");
			return;
		}

		try {
			const response = await fetch(`/api/pre-orders/${id}/finalize`, {
				method: "PUT",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				setPreOrders(
					preOrders.map((po) =>
						po.id === id ? { ...po, status: "FINALIZED" } : po,
					),
				);
				setSelectedPreOrder(null);
			} else {
				const error = await response.json();
				alert(error.error);
			}
		} catch (_err) {
			alert("Ocorreu um erro ao finalizar o pré-pedido.");
		}
	};

	const handleDelete = async (id: string) => {
		const token = localStorage.getItem("token");
		if (!token) {
			router.push("/auth/login");
			return;
		}

		try {
			const response = await fetch(`/api/pre-orders/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (response.ok) {
				setPreOrders(preOrders.filter((po) => po.id !== id));
				setSelectedPreOrder(null);
			} else {
				const error = await response.json();
				alert(error.error);
			}
		} catch (_err) {
			alert("Ocorreu um erro ao excluir o pré-pedido.");
		}
	};

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="p-6">
			<h1 className="text-3xl font-bold mb-6">Pré-pedidos</h1>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>ID</TableHead>
						<TableHead>Status</TableHead>
						<TableHead>Data</TableHead>
						<TableHead>Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{preOrders.map((preOrder) => (
						<TableRow key={preOrder.id}>
							<TableCell>{preOrder.id}</TableCell>
							<TableCell>
								<Badge
									variant={
										preOrder.status === "ACTIVE" ? "default" : "secondary"
									}
								>
									{preOrder.status === "ACTIVE" ? "Ativo" : "Finalizado"}
								</Badge>
							</TableCell>
							<TableCell>
								{new Date(preOrder.createdAt).toLocaleDateString("pt-BR")}
							</TableCell>
							<TableCell>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setSelectedPreOrder(preOrder)}
								>
									Visualizar
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{selectedPreOrder && (
				<PreOrderModal
					isOpen={!!selectedPreOrder}
					onClose={() => setSelectedPreOrder(null)}
					preOrderItems={selectedPreOrder.items}
					status={selectedPreOrder.status}
					onFinalize={() => handleFinalize(selectedPreOrder.id)}
					onDelete={() => handleDelete(selectedPreOrder.id)}
				/>
			)}
		</div>
	);
}
