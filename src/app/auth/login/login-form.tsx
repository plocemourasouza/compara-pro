"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { AuthFormLoading, AuthPanel } from "@/components/auth/auth-panel";
import styles from "@/components/auth/auth-screen.module.css";
import ClientOnly from "@/components/client-only";
import { Button } from "@/components/ui/button";
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
		<AuthPanel
			eyebrow="Bem-vindo ao Compara Pró"
			title="Entrar"
			description="Acesse sua conta para continuar."
		>
			<form action={formAction}>
				<div className={styles.field}>
					<Label htmlFor="email">E-mail</Label>
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="username"
						placeholder="seu@email.com"
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
						autoComplete="current-password"
						placeholder="Digite sua senha"
						disabled={pending}
						required
					/>
				</div>
				{state?.error && (
					<div
						role="alert"
						className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
					>
						{state.error}
					</div>
				)}
				<Button type="submit" className={styles.submit} disabled={pending}>
					{pending ? "Entrando..." : "Entrar"}
					<ArrowRight aria-hidden="true" />
				</Button>
			</form>
			<p className={styles.secondaryCopy}>
				Primeiro acesso?{" "}
				<Link href="/auth/primeiro-acesso">Ative sua conta</Link>
			</p>
			<hr className={styles.separator} />
			<p className={styles.secondaryCopy}>
				Ainda não tem uma conta?
				<br />
				<Link href="/auth/register">Criar conta de comprador →</Link>
			</p>
		</AuthPanel>
	);
}

const LoadingFallback = () => (
	<AuthPanel
		eyebrow="Bem-vindo ao Compara Pró"
		title="Entrar"
		description="Acesse sua conta para continuar."
	>
		<AuthFormLoading />
	</AuthPanel>
);

export default function LoginForm() {
	return (
		<ClientOnly fallback={<LoadingFallback />}>
			<LoginFormContent />
		</ClientOnly>
	);
}
