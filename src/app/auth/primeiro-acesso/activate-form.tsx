"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { AuthFormLoading, AuthPanel } from "@/components/auth/auth-panel";
import styles from "@/components/auth/auth-screen.module.css";
import ClientOnly from "@/components/client-only";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
	activateAccountAction,
	resendActivationCodeAction,
} from "@/lib/actions/auth";

function ActivateFormContent() {
	const router = useRouter();
	const [state, formAction, pending] = useActionState(
		activateAccountAction,
		null,
	);
	const [resendState, resendAction, resending] = useActionState(
		resendActivationCodeAction,
		null,
	);
	const [email, setEmail] = useState("");
	const [code, setCode] = useState("");

	useEffect(() => {
		if (state?.success && state.redirectUrl) {
			router.push(state.redirectUrl);
		}
	}, [state, router]);

	const handleResend = () => {
		const fd = new FormData();
		fd.set("email", email);
		resendAction(fd);
	};

	return (
		<AuthPanel
			eyebrow="Ative sua conta"
			title="Primeiro acesso"
			description="Confirme o código recebido por e-mail e defina sua senha."
		>
			<form action={formAction}>
				<div className={styles.field}>
					<Label htmlFor="email">E-mail</Label>
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						placeholder="seu@email.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={pending}
						required
					/>
				</div>
				<div className={styles.field}>
					<Label htmlFor="code">Código de verificação</Label>
					<input type="hidden" name="code" value={code} />
					<InputOTP
						id="code"
						autoComplete="one-time-code"
						maxLength={6}
						value={code}
						onChange={setCode}
						disabled={pending}
					>
						<InputOTPGroup className={styles.otpGroup}>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>
				</div>
				<div className={styles.field}>
					<Label htmlFor="password">Nova senha</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autoComplete="new-password"
						placeholder="Mínimo de 6 caracteres"
						disabled={pending}
						required
					/>
				</div>
				<div className={styles.field}>
					<Label htmlFor="confirmPassword">Confirmar senha</Label>
					<Input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						autoComplete="new-password"
						placeholder="Repita sua senha"
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
				{resendState?.error && (
					<div
						role="alert"
						className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive"
					>
						{resendState.error}
					</div>
				)}
				{resendState?.message && (
					<div
						role="status"
						className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary"
					>
						{resendState.message}
					</div>
				)}
				<Button type="submit" className={styles.submit} disabled={pending}>
					{pending ? "Ativando..." : "Ativar conta"}
					<ArrowRight aria-hidden="true" />
				</Button>
			</form>
			<div className={styles.secondaryCopy}>
				<Button
					type="button"
					variant="link"
					className="h-auto p-0 text-xs text-primary"
					onClick={handleResend}
					disabled={resending || !email}
				>
					{resending ? "Reenviando..." : "Reenviar código"}
				</Button>
				<br />
				<Link href="/auth/login">Voltar para o login</Link>
			</div>
		</AuthPanel>
	);
}

const LoadingFallback = () => (
	<AuthPanel
		eyebrow="Ative sua conta"
		title="Primeiro acesso"
		description="Confirme o código recebido por e-mail e defina sua senha."
	>
		<AuthFormLoading />
	</AuthPanel>
);

export default function ActivateForm() {
	return (
		<ClientOnly fallback={<LoadingFallback />}>
			<ActivateFormContent />
		</ClientOnly>
	);
}
