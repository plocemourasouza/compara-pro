"use client";

import { useState } from "react";
import SupplierUploadClient from "@/app/supplier/supplier-upload-client";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type User = {
	id: string;
	name: string;
	email: string;
	area: string;
	company: { id: string; name: string; type: string } | null;
};

interface ProductImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	suppliers: { id: string; name: string }[];
	user: User;
	onImported: () => void;
}

export function ProductImportDialog({
	open,
	onOpenChange,
	suppliers,
	user,
	onImported,
}: ProductImportDialogProps) {
	// Etapa 2 (mapeamento + tabela) alarga o modal; etapa 1 (upload) fica estreita.
	const [wide, setWide] = useState(false);

	const handleOpenChange = (next: boolean) => {
		if (!next) setWide(false);
		onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				className={cn(
					"flex max-h-[90vh] w-[calc(100vw-2rem)] flex-col overflow-y-auto",
					wide ? "sm:max-w-360" : "sm:max-w-2xl",
				)}
			>
				<DialogHeader>
					<DialogTitle>Importar lista de produtos</DialogTitle>
				</DialogHeader>
				<SupplierUploadClient
					user={user}
					suppliers={suppliers}
					onSuccess={() => {
						onImported();
					}}
					onClose={() => onOpenChange(false)}
					onStageChange={(stage) => setWide(stage === "mapping")}
				/>
			</DialogContent>
		</Dialog>
	);
}
