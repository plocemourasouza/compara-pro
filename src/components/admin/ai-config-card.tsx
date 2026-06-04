"use client";

import { Bot, Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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
}

const PROVIDERS: { id: Provider; label: string }[] = [
	{ id: "ANTHROPIC", label: "Anthropic (Claude)" },
	{ id: "OPENAI", label: "OpenAI" },
];

export default function AiConfigCard() {
	const [provider, setProvider] = useState<Provider>("ANTHROPIC");
	const [apiKey, setApiKey] = useState("");
	const [showKey, setShowKey] = useState(false);
	const [models, setModels] = useState<ModelInfo[]>([]);
	const [model, setModel] = useState("");
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
		if (!apiKey) {
			toast.error("Reinforme a chave para salvar");
			return;
		}
		if (!model) {
			toast.error("Selecione um modelo");
			return;
		}
		setSaving(true);
		try {
			const res = await fetch("/api/admin/ai-config", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ provider, key: apiKey, model }),
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

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Bot className="h-5 w-5 text-primary" />
					Inteligência Artificial (parecer)
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{current?.configured && (
					<div className="flex items-center gap-2 rounded border border-border bg-muted/40 px-3 py-2 text-sm">
						<ShieldCheck className="h-4 w-4 text-success" />
						<span>
							Configurado: <strong>{current.provider}</strong> · modelo{" "}
							<strong>{current.model}</strong> · chave{" "}
							<span className="font-mono">••••{current.keyHint}</span>
						</span>
					</div>
				)}

				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-1">
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

					<div className="space-y-1">
						<Label>Chave de API</Label>
						<div className="relative">
							<Input
								type={showKey ? "text" : "password"}
								value={apiKey}
								onChange={(e) => setApiKey(e.target.value)}
								placeholder={
									current?.configured
										? `••••••••${current.keyHint}`
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
					</div>
				</div>

				<div className="flex flex-wrap items-end gap-3">
					<Button
						type="button"
						variant="outline"
						onClick={validate}
						disabled={validating}
					>
						{validating ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"Validar chave"
						)}
					</Button>
					<div className="min-w-[200px] flex-1 space-y-1">
						<Label>Modelo</Label>
						<Select
							value={model}
							onValueChange={setModel}
							disabled={models.length === 0}
						>
							<SelectTrigger>
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

				<p className="text-xs text-muted-foreground">
					A chave é criptografada no servidor e nunca é exibida novamente. Sem
					configuração, o parecer usa apenas a análise determinística.
				</p>
			</CardContent>
		</Card>
	);
}
