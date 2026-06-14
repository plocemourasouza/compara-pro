"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface CnpjCellProps {
	/** CNPJ já anonimizado pelo back (raiz parcial + dígitos ocultos). Nunca o completo. */
	masked?: string;
	companyId: string;
}

/**
 * Exibe o CNPJ anonimizado (LGPD) + ação de copiar. A cópia busca o CNPJ
 * completo no back sob demanda e o escreve no clipboard, sem nunca exibi-lo.
 */
export function CnpjCell({ masked, companyId }: CnpjCellProps) {
	const [copied, setCopied] = useState(false);
	const [loading, setLoading] = useState(false);

	if (!masked) return <span>-</span>;

	const handleCopy = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/companies/${companyId}/cnpj`);
			const data = await res.json();
			if (!res.ok || !data.cnpj) {
				toast.error(data.error || "Não foi possível copiar o CNPJ");
				return;
			}
			await navigator.clipboard.writeText(data.cnpj);
			setCopied(true);
			toast.success("CNPJ copiado");
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Não foi possível copiar o CNPJ");
		} finally {
			setLoading(false);
		}
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: isola o clique do botão para não abrir o modal de detalhe da linha
		<div
			className="flex items-center gap-1"
			onClick={(e) => e.stopPropagation()}
			onKeyDown={(e) => e.stopPropagation()}
		>
			<span className="tabular-nums">{masked}</span>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7"
				onClick={handleCopy}
				disabled={loading}
				aria-label="Copiar CNPJ"
				title="Copiar CNPJ"
			>
				{copied ? (
					<Check className="h-3.5 w-3.5 text-success" />
				) : (
					<Copy className="h-3.5 w-3.5" />
				)}
			</Button>
		</div>
	);
}
