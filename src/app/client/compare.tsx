import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface Product {
	id: string;
	code?: string;
	sku?: string;
	name: string;
	price?: number;
	companyId: string;
	company: {
		name: string;
	};
}

interface ComparisonItem {
	product: Product;
	bestPrice: number;
	suppliers: Product[];
}

export default function ComparePage() {
	const [comparison, setComparison] = useState<ComparisonItem[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	useEffect(() => {
		const fetchComparison = async () => {
			const token = localStorage.getItem("token");
			if (!token) {
				router.push("/auth/login");
				return;
			}

			try {
				const response = await fetch("/api/compare", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (response.ok) {
					const data = await response.json();
					setComparison(data);
				} else {
					router.push("/auth/login");
				}
			} catch (err) {
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		fetchComparison();
	}, [router]);

	const handleGeneratePreOrder = async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			router.push("/auth/login");
			return;
		}

		try {
			const response = await fetch("/api/pre-orders", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ items: comparison }),
			});

			if (response.ok) {
				alert("Pré-pedido gerado com sucesso!");
				router.push("/dashboard/client/pre-orders");
			} else {
				const error = await response.json();
				alert(error.error);
			}
		} catch (_err) {
			alert("Ocorreu um erro ao gerar o pré-pedido.");
		}
	};

	if (loading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="p-6">
			<h1 className="text-3xl font-bold mb-6">Comparação de Preços</h1>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Código</TableHead>
						<TableHead>SKU</TableHead>
						<TableHead>Produto</TableHead>
						<TableHead>Melhor Preço</TableHead>
						<TableHead>Fornecedor</TableHead>
						<TableHead>Ações</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{comparison.map((item, index) => (
						<TableRow key={item.product.id}>
							<TableCell>{item.product.code}</TableCell>
							<TableCell>{item.product.sku}</TableCell>
							<TableCell>{item.product.name}</TableCell>
							<TableCell>
								{item.bestPrice.toLocaleString("pt-BR", {
									style: "currency",
									currency: "BRL",
								})}
							</TableCell>
							<TableCell>
								{
									item.suppliers.find((s) => s.price === item.bestPrice)
										?.company.name
								}
							</TableCell>
							<TableCell>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										const newComparison = [...comparison];
										newComparison.splice(index, 1);
										setComparison(newComparison);
									}}
								>
									Remover
								</Button>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			<div className="mt-6">
				<Button onClick={handleGeneratePreOrder}>Gerar Pré-pedido</Button>
			</div>
		</div>
	);
}
