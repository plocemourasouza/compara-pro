"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

interface AreaErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
	/** Rota de início da área (ex.: "/admin", "/supplier", "/client"). */
	homeHref: string;
}

/**
 * Corpo compartilhado pelos error.tsx de cada área (admin/supplier/client).
 * Renderiza dentro do layout da área — sidebar e header seguem visíveis,
 * só o segmento filho é substituído por este boundary.
 */
export function AreaError({ error, reset, homeHref }: AreaErrorProps) {
	useEffect(() => {
		// console.error é o uso correto e esperado num error boundary.
		console.error(error.digest ?? error.message);
	}, [error]);

	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-6 py-24 text-center">
			<AlertTriangle className="h-12 w-12 text-destructive" />
			<div className="space-y-2">
				<h1 className="text-xl font-bold tracking-tight">
					Algo deu errado nesta área
				</h1>
				<p className="text-muted-foreground">
					Ocorreu um erro inesperado ao carregar esta página. Você pode tentar
					novamente.
				</p>
			</div>
			<div className="flex items-center gap-3">
				<Button onClick={reset}>Tentar novamente</Button>
				<Button asChild variant="outline">
					<Link href={homeHref}>Ir para o início</Link>
				</Button>
			</div>
		</div>
	);
}
