"use client";

import {
	Bot,
	Check,
	Eye,
	EyeOff,
	Loader2,
	RotateCcw,
	ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_PARECER_SYSTEM_PROMPT } from "@/lib/ai/default-prompt";

type Provider = "ANTHROPIC" | "OPENAI";
interface ModelInfo {
	id: string;
	label?: string;
}
interface PublicConfig {
	configured: boolean;
	provider: Provider | null;
	model: string | null;
	keyHint: string | null;
	systemPrompt: string | null;
}

const PROVIDERS: { id: Provider; label: string }[] = [
	{ id: "ANTHROPIC", label: "Anthropic (Claude)" },
	{ id: "OPENAI", label: "OpenAI" },
];

function SectionTitle({
	step,
	title,
	hint,
}: {
	step: number;
	title: string;
	hint?: string;
}) {
	return (
		<div className="flex items-baseline gap-2">
			<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
				{step}
			</span>
			<h4 className="text-sm font-semibold">{title}</h4>
			{hint && <span className="text-xs text-muted-foreground">— {hint}</span>}
		</div>
	);
}

export default function AiConfigCard() {
	const [provider, setProvider] = useState<Provider>("ANTHROPIC");
	const [apiKey, setApiKey] = useState("");
	const [showKey, setShowKey] = useState(false);
	const [models, setModels] = useState<ModelInfo[]>([]);
	const [model, setModel] = useState("");
	const [prompt, setPrompt] = useState(DEFAULT_PARECER_SYSTEM_PROMPT);
	const [current, setCurrent] = useState<PublicConfig | null>(null);
	const [validating, setValidating] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetch("/api/admin/ai-config")
			.then((r) => (r.ok ? r.json() : null))
			.then((d: PublicConfig | null) => {
				if (d?.configured) {
					setCurrent(d);
					if (d.provider) setProvider(d.provider);
					if (d.model) {
						setModel(d.model);
						setModels([{ id: d.model }]);
					}
					if (d.systemPrompt) setPrompt(d.systemPrompt);
				}
			})
			.catch(() => {});
	}, []);

	const validate = async () => {
		if (!apiKey) {
			toast.error("Informe a chave de API");
			return;
		}
		setValidating(true);
		try {
			const res = await fetch("/api/admin/ai-config/validate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ provider, key: apiKey }),
			});
			const data = (await res.json()) as {
				valid?: boolean;
				models?: ModelInfo[];
				error?: string;
			};
			if (!res.ok) {
				throw new Error(data.error ?? "Falha na validação");
			}
			if (!data.valid) {
				toast.error(data.error ?? "Chave inválida");
				setModels([]);
				return;
			}
			const list = data.models ?? [];
			setModels(list);
			const first = list[0];
			if (first) setModel(first.id);
			toast.success(`Chave válida — ${list.length} modelo(s) disponíveis`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro ao validar");
		} finally {
			setValidating(false);
		}
	};

	const save = async () => {
		if (!model) {
			toast.error("Selecione um modelo");
			return;
		}
		if (!current?.configured && !apiKey) {
			toast.error("Informe a chave de API");
			return;
		}
		setSaving(true);
		try {
			const res = await fetch("/api/admin/ai-config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider,
					model,
					systemPrompt: prompt,
					...(apiKey ? { key: apiKey } : {}),
				}),
			});
			const data = (await res.json()) as {
				config?: PublicConfig;
				error?: string;
			};
			if (!res.ok || !data.config) {
				throw new Error(data.error ?? "Falha ao salvar");
			}
			setCurrent(data.config);
			setApiKey("");
			toast.success("Configuração de IA salva");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro ao salvar");
		} finally {
			setSaving(false);
		}
	};

	const promptChanged = prompt.trim() !== DEFAULT_PARECER_SYSTEM_PROMPT;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bot className="h-5 w-5 text-primary" />
					Inteligência Artificial (parecer)
				</CardTitle>
				<CardDescription>
					Configure o provedor, o modelo e as instruções que o agente usa para
					gerar o parecer da comparação.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{current?.configured ? (
					<div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm">
						<span className="flex items-center gap-1.5 font-medium text-success">
							<ShieldCheck className="h-4 w-4" />
							Ativo
						</span>
						<span className="text-muted-foreground">
							Provedor{" "}
							<strong className="text-foreground">{current.provider}</strong>
						</span>
						<span className="text-muted-foreground">
							Modelo{" "}
							<strong className="text-foreground">{current.model}</strong>
						</span>
						<span className="text-muted-foreground">
							Chave <span className="font-mono">••••{current.keyHint}</span>
						</span>
					</div>
				) : (
					<div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
						Nenhuma IA configurada — o parecer usa apenas a análise
						determinística (sem narrativa por IA).
					</div>
				)}

				{/* 1. Provider + key */}
				<div className="space-y-3">
					<SectionTitle step={1} title="Provedor e chave" />
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-1.5">
							<Label>Provedor</Label>
							<Select
								value={provider}
								onValueChange={(v: Provider) => {
									setProvider(v);
									setModels([]);
									setModel("");
								}}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{PROVIDERS.map((p) => (
										<SelectItem key={p.id} value={p.id}>
											{p.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<Label>Chave de API</Label>
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Input
										type={showKey ? "text" : "password"}
										value={apiKey}
										onChange={(e) => setApiKey(e.target.value)}
										placeholder={
											current?.configured
												? `••••••••${current.keyHint} (manter)`
												: "Cole a chave do provedor"
										}
									/>
									<button
										type="button"
										onClick={() => setShowKey((s) => !s)}
										className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
										aria-label={showKey ? "Ocultar chave" : "Mostrar chave"}
									>
										{showKey ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
								<Button
									type="button"
									variant="outline"
									onClick={validate}
									disabled={validating}
								>
									{validating ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										"Validar"
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* 2. Model */}
				<div className="space-y-3 border-t border-border pt-5">
					<SectionTitle
						step={2}
						title="Modelo"
						hint="validar a chave lista os disponíveis"
					/>
					<Select
						value={model}
						onValueChange={setModel}
						disabled={models.length === 0}
					>
						<SelectTrigger className="md:w-1/2">
							<SelectValue placeholder="Valide a chave para listar modelos" />
						</SelectTrigger>
						<SelectContent>
							{models.map((m) => (
								<SelectItem key={m.id} value={m.id}>
									{m.label ?? m.id}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* 3. Prompt */}
				<div className="space-y-3 border-t border-border pt-5">
					<div className="flex items-center justify-between">
						<SectionTitle step={3} title="Prompt do agente" />
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							disabled={!promptChanged}
							onClick={() => setPrompt(DEFAULT_PARECER_SYSTEM_PROMPT)}
						>
							<RotateCcw className="mr-1 h-3 w-3" />
							Restaurar padrão
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						Instruções (system prompt) que orientam o tom e o foco do parecer.
						Os números são sempre calculados pelo sistema — o agente apenas
						redige o texto e as vantagens.
					</p>
					<Textarea
						value={prompt}
						onChange={(e) => setPrompt(e.target.value)}
						rows={14}
						className="min-h-[300px] resize-y font-mono text-xs leading-relaxed"
						placeholder={DEFAULT_PARECER_SYSTEM_PROMPT}
					/>
					<p className="text-right text-xs text-muted-foreground">
						{prompt.length}/4000
					</p>
				</div>

				{/* Save */}
				<div className="flex items-center justify-between border-t border-border pt-5">
					<p className="max-w-md text-xs text-muted-foreground">
						A chave é criptografada no servidor e nunca exibida. Editar modelo
						ou prompt não exige reinformar a chave.
					</p>
					<Button type="button" onClick={save} disabled={saving || !model}>
						{saving ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<>
								<Check className="mr-1 h-4 w-4" />
								Salvar
							</>
						)}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
