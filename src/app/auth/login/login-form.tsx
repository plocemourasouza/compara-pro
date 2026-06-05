"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import ClientOnly from "@/components/client-only";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";

function LoginFormContent() {
	const [state, formAction, pending] = useActionState(loginAction, null);
	const router = useRouter();

	// Handle successful login redirect
	useEffect(() => {
		if (state?.success && state?.redirectUrl) {
			router.push(state.redirectUrl);
		}
	}, [state, router]);

	return (
		<div className="min-h-screen flex items-center justify-center bg-background">
			<div className="w-full max-w-md space-y-6">
				{/* Logo */}
				<div className="text-center">
					<Link href="/" className="inline-flex items-center space-x-2">
						<BarChart3 className="h-8 w-8 text-primary" />
						<span className="text-2xl font-bold text-foreground">
							Compara Pró
						</span>
					</Link>
					<p className="mt-2 text-sm text-muted-foreground">
						Faça login para acessar sua conta
					</p>
				</div>

				<Card className="border-0 shadow-lg">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl font-semibold text-center">
							Entrar
						</CardTitle>
						<CardDescription className="text-center">
							Digite suas credenciais para acessar o sistema
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form action={formAction} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="seu@email.com"
									disabled={pending}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Senha</Label>
								<Input
									id="password"
									name="password"
									type="password"
									placeholder="••••••••"
									disabled={pending}
									required
								/>
							</div>
							{state?.error && (
								<div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive">
									{state.error}
								</div>
							)}
							<Button type="submit" className="w-full" disabled={pending}>
								{pending ? "Entrando..." : "Entrar"}
							</Button>
						</form>

						<div className="mt-6 text-center text-sm">
							<span className="text-muted-foreground">Não tem uma conta? </span>
							<Link
								href="/auth/register"
								className="font-medium text-primary hover:text-primary"
							>
								Cadastre-se aqui
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

const LoadingFallback = () => (
	<div className="min-h-screen flex items-center justify-center bg-background">
		<div className="w-full max-w-md space-y-6">
			<div className="text-center">
				<div className="inline-flex items-center space-x-2">
					<BarChart3 className="h-8 w-8 text-primary" />
					<span className="text-2xl font-bold text-foreground">
						Compara Pró
					</span>
				</div>
				<p className="mt-2 text-sm text-muted-foreground">Carregando...</p>
			</div>
		</div>
	</div>
);

export default function LoginForm() {
	return (
		<ClientOnly fallback={<LoadingFallback />}>
			<LoginFormContent />
		</ClientOnly>
	);
}
