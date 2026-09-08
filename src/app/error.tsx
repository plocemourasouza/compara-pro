"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

// App Router exige export default em error.tsx.
export default function RootError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// console.error é o uso correto e esperado num error boundary.
		console.error(error.digest ?? error.message);
	}, [error]);

	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
			<AlertTriangle className="h-12 w-12 text-destructive" />
			<div className="space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">Algo deu errado</h1>
				<p className="text-muted-foreground">
					Ocorreu um erro inesperado. Você pode tentar novamente.
				</p>
			</div>
			<Button onClick={reset}>Tentar novamente</Button>
		</div>
	);
}
