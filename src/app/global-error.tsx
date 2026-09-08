"use client";

import { useEffect } from "react";

// App Router exige export default em global-error.tsx. Este boundary
// substitui o root layout ao capturar um erro nele, então precisa renderizar
// sua própria árvore <html>/<body>.
export default function GlobalError({
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
		<html lang="pt-BR">
			<body>
				<div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-white px-6 text-center text-slate-900">
					<div className="space-y-2">
						<h1 className="text-2xl font-bold tracking-tight">
							Algo deu errado
						</h1>
						<p className="text-slate-600">
							Ocorreu um erro inesperado ao carregar a aplicação. Você pode
							tentar novamente.
						</p>
					</div>
					<button
						type="button"
						onClick={reset}
						className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-900/90"
					>
						Tentar novamente
					</button>
				</div>
			</body>
		</html>
	);
}
