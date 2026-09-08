import { FileQuestion } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// App Router exige export default em not-found.tsx.
export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
			<FileQuestion className="h-12 w-12 text-muted-foreground" />
			<div className="space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">
					Página não encontrada
				</h1>
				<p className="text-muted-foreground">
					O endereço que você tentou acessar não existe ou foi removido.
				</p>
			</div>
			<Button asChild>
				<Link href="/">Voltar para o início</Link>
			</Button>
		</div>
	);
}
