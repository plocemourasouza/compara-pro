"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
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
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="w-full max-w-md space-y-6">
				<div className="text-center">
					<Link href="/" className="inline-flex items-center space-x-2">
						<BarChart3 className="h-8 w-8 text-primary" />
						<span className="text-2xl font-bold text-foreground">
							Compara Pró
						</span>
					</Link>
					<p className="mt-2 text-sm text-muted-foreground">
						Confirme o código recebido por e-mail e defina sua senha
					</p>
				</div>

				<Card className="border-0 shadow-lg">
					<CardHeader className="space-y-1">
						<CardTitle className="text-center text-2xl font-semibold">
							Primeiro acesso
						</CardTitle>
						<CardDescription className="text-center">
							Use o código de 6 dígitos enviado para o seu e-mail
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
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									disabled={pending}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="code">Código de verificação</Label>
								<input type="hidden" name="code" value={code} />
								<InputOTP
									maxLength={6}
									value={code}
									onChange={setCode}
									disabled={pending}
								>
									<InputOTPGroup>
										<InputOTPSlot index={0} />
										<InputOTPSlot index={1} />
										<InputOTPSlot index={2} />
										<InputOTPSlot index={3} />
										<InputOTPSlot index={4} />
										<InputOTPSlot index={5} />
									</InputOTPGroup>
								</InputOTP>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Nova senha</Label>
								<Input
									id="password"
									name="password"
									type="password"
									placeholder="Mínimo 6 caracteres"
									disabled={pending}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirmPassword">Confirmar senha</Label>
								<Input
									id="confirmPassword"
									name="confirmPassword"
									type="password"
									placeholder="Repita a senha"
									disabled={pending}
									required
								/>
							</div>

							{state?.error && (
								<div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
									{state.error}
								</div>
							)}
							{resendState?.message && (
								<div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
									{resendState.message}
								</div>
							)}

							<Button type="submit" className="w-full" disabled={pending}>
								{pending ? "Ativando..." : "Ativar conta"}
							</Button>
						</form>

						<div className="mt-4 text-center text-sm">
							<Button
								type="button"
								variant="link"
								className="h-auto p-0 text-primary"
								onClick={handleResend}
								disabled={resending || !email}
							>
								{resending ? "Reenviando..." : "Reenviar código"}
							</Button>
						</div>

						<div className="mt-2 text-center text-sm">
							<Link
								href="/auth/login"
								className="font-medium text-muted-foreground hover:text-foreground"
							>
								Voltar para o login
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

const LoadingFallback = () => (
	<div className="flex min-h-screen items-center justify-center bg-background">
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

export default function ActivateForm() {
	return (
		<ClientOnly fallback={<LoadingFallback />}>
			<ActivateFormContent />
		</ClientOnly>
	);
}
