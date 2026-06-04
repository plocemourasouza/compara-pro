"use client";

import { BarChart3, Building2, Lock, Mail, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
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
import { registerAction } from "@/lib/actions/auth";

export default function RegisterPage() {
	const [state, formAction, pending] = useActionState(registerAction, null);
	const [confirmPassword, setConfirmPassword] = useState("");
	const [clientError, setClientError] = useState("");
	const router = useRouter();

	// Handle successful registration redirect
	useEffect(() => {
		if (state?.success && state?.redirectUrl) {
			router.push(state.redirectUrl);
		}
	}, [state, router]);

	const handleFormAction = async (formData: FormData) => {
		const password = formData.get("password") as string;

		// Validações do frontend
		if (password !== confirmPassword) {
			setClientError("As senhas não coincidem");
			return;
		}

		if (password.length < 6) {
			setClientError("A senha deve ter pelo menos 6 caracteres");
			return;
		}

		// Limpar erros e chamar a action
		setClientError("");
		return formAction(formData);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background py-12">
			<div className="w-full max-w-md space-y-6">
				{/* Logo */}
				<div className="text-center">
					<Link href="/" className="inline-flex items-center space-x-2">
						<BarChart3 className="h-8 w-8 text-primary" />
						<span className="text-2xl font-bold text-foreground">
							PriceCompare
						</span>
					</Link>
					<p className="mt-2 text-sm text-muted-foreground">
						Crie sua conta e economize em suas compras
					</p>
				</div>

				<Card className="border-0 shadow-lg">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl font-semibold text-center">
							Criar Conta
						</CardTitle>
						<CardDescription className="text-center">
							Cadastre-se como cliente para começar
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form action={handleFormAction} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name" className="flex items-center gap-2">
									<User className="h-4 w-4" />
									Nome Completo
								</Label>
								<Input
									id="name"
									name="name"
									type="text"
									placeholder="Seu nome completo"
									disabled={pending}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email" className="flex items-center gap-2">
									<Mail className="h-4 w-4" />
									Email
								</Label>
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
								<Label
									htmlFor="companyName"
									className="flex items-center gap-2"
								>
									<Building2 className="h-4 w-4" />
									Nome da Empresa
								</Label>
								<Input
									id="companyName"
									name="companyName"
									type="text"
									placeholder="Nome da sua empresa"
									disabled={pending}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password" className="flex items-center gap-2">
									<Lock className="h-4 w-4" />
									Senha
								</Label>
								<Input
									id="password"
									name="password"
									type="password"
									placeholder="••••••••"
									disabled={pending}
									required
									minLength={6}
								/>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="confirmPassword"
									className="flex items-center gap-2"
								>
									<Lock className="h-4 w-4" />
									Confirmar Senha
								</Label>
								<Input
									id="confirmPassword"
									type="password"
									placeholder="••••••••"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									disabled={pending}
									required
									minLength={6}
								/>
							</div>

							<input type="hidden" name="role" value="CLIENT" />

							{(state?.error || clientError) && (
								<div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive">
									{state?.error || clientError}
								</div>
							)}

							<Button type="submit" className="w-full" disabled={pending}>
								{pending ? "Criando conta..." : "Criar Conta"}
							</Button>
						</form>

						<div className="mt-6 text-center text-sm">
							<span className="text-muted-foreground">Já tem uma conta? </span>
							<Link
								href="/auth/login"
								className="font-medium text-primary hover:text-primary"
							>
								Faça login aqui
							</Link>
						</div>

						{/* Benefícios */}
						<div className="mt-6 pt-6 border-t border-border">
							<p className="text-xs text-muted-foreground text-center mb-3">
								O que você ganha ao se cadastrar:
							</p>
							<div className="space-y-2 text-xs text-muted-foreground">
								<div className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-success rounded-full"></div>
									<span>Comparação automática de preços</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-success rounded-full"></div>
									<span>Acesso a fornecedores verificados</span>
								</div>
								<div className="flex items-center gap-2">
									<div className="w-1.5 h-1.5 bg-success rounded-full"></div>
									<span>Economia média de 30% nos custos</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
