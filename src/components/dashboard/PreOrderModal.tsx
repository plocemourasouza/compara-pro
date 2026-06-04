import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface PreOrderItem {
	id: string;
	product: {
		code?: string;
		sku?: string;
		name: string;
	};
	price: number;
}

interface PreOrderModalProps {
	isOpen: boolean;
	onClose: () => void;
	preOrderItems: PreOrderItem[];
	status: string;
	onFinalize: () => void;
	onDelete: () => void;
}

export default function PreOrderModal({
	isOpen,
	onClose,
	preOrderItems,
	status,
	onFinalize,
	onDelete,
}: PreOrderModalProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						Itens do Pré-pedido
						<Badge variant={status === "ACTIVE" ? "default" : "secondary"}>
							{status === "ACTIVE" ? "Ativo" : "Finalizado"}
						</Badge>
					</DialogTitle>
				</DialogHeader>

				<div className="max-h-96 overflow-y-auto">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Código</TableHead>
								<TableHead>SKU</TableHead>
								<TableHead>Produto</TableHead>
								<TableHead className="text-right">Preço</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{preOrderItems.map((item) => (
								<TableRow key={item.id}>
									<TableCell>{item.product.code}</TableCell>
									<TableCell>{item.product.sku}</TableCell>
									<TableCell>{item.product.name}</TableCell>
									<TableCell className="text-right">
										{item.price.toLocaleString("pt-BR", {
											style: "currency",
											currency: "BRL",
										})}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>

				<div className="flex justify-between pt-4">
					<Button variant="destructive" onClick={onDelete}>
						Excluir Pré-pedido
					</Button>
					{status === "ACTIVE" && (
						<Button onClick={onFinalize}>Marcar como Finalizado</Button>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
