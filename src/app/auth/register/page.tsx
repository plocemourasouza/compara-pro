"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { AuthPanel } from "@/components/auth/auth-panel";
import styles from "@/components/auth/auth-screen.module.css";
import { Button } from "@/components/ui/button";
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
		<AuthPanel
			eyebrow="Para quem compra no atacado"
			title="Criar conta"
			description="Comece pela sua próxima lista de compras."
			compact
		>
			<form action={handleFormAction}>
				<div className={styles.field}>
					<Label htmlFor="name">Nome completo</Label>
					<Input
						id="name"
						name="name"
						type="text"
						autoComplete="name"
						placeholder="Seu nome completo"
						disabled={pending}
						required
					/>
				</div>
				<div className={styles.field}>
					<Label htmlFor="email">E-mail</Label>
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						placeholder="seu@email.com"
						disabled={pending}
						required
					/>
				</div>
				<div className={styles.field}>
					<Label htmlFor="companyName">Nome da empresa</Label>
					<Input
						id="companyName"
						name="companyName"
						type="text"
						autoComplete="organization"
						placeholder="Nome da sua empresa"
						disabled={pending}
						required
					/>
				</div>
				<div className={styles.field}>
					<Label htmlFor="password">Senha</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="new-password"
						placeholder="Mínimo de 6 caracteres"
						disabled={pending}
						required
						minLength={6}
					/>
				</div>
				<div className={styles.field}>
					<Label htmlFor="confirmPassword">Confirmar senha</Label>
					<Input
						id="confirmPassword"
						type="password"
						autoComplete="new-password"
						placeholder="Repita sua senha"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						disabled={pending}
						required
						minLength={6}
					/>
				</div>
				<input type="hidden" name="role" value="CLIENT" />
				{(state?.error || clientError) && (
					<div
						role="alert"
						className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
					>
						{state?.error || clientError}
					</div>
				)}
				<Button type="submit" className={styles.submit} disabled={pending}>
					{pending ? "Criando conta..." : "Criar conta"}
					<ArrowRight aria-hidden="true" />
				</Button>
			</form>
			<p className={styles.secondaryCopy}>
				Já tem uma conta? <Link href="/auth/login">Entrar</Link>
			</p>
		</AuthPanel>
	);
}
