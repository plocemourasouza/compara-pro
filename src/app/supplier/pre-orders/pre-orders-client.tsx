"use client";

interface SupplierUser {
	id: string;
	name: string;
	email: string;
	role: string;
	company: { id: string; name: string; type: string } | null;
}

interface PreOrdersClientProps {
	user: SupplierUser;
}

export default function PreOrdersClient({ user }: PreOrdersClientProps) {
	return (
		<div className="p-6">
			<h1 className="text-2xl font-semibold">Pré-pedidos</h1>
			<p className="text-muted-foreground mt-2">
				Olá {user.name}. A área de pré-pedidos do fornecedor está em construção.
			</p>
		</div>
	);
}
