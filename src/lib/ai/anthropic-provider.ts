import { timedFetch } from "./http";
import type { AiProvider, GenerateParams, ValidateResult } from "./types";

const BASE = "https://api.anthropic.com/v1";
const VERSION = "2023-06-01";

interface ModelsResponse {
	data?: Array<{ id?: string; display_name?: string }>;
}
interface MessagesResponse {
	content?: Array<{ text?: string }>;
}

export const anthropicProvider: AiProvider = {
	id: "ANTHROPIC",

	async validateKey(key: string): Promise<ValidateResult> {
		const r = await timedFetch(
			`${BASE}/models?limit=100`,
			{ headers: { "x-api-key": key, "anthropic-version": VERSION } },
			10_000,
		);
		if (r.status === 401) {
			return { valid: false, models: [], error: "Chave inválida" };
		}
		if (!r.ok) {
			return { valid: false, models: [], error: "Falha ao validar a chave" };
		}
		const body = r.json as ModelsResponse;
		const models = (body.data ?? [])
			.filter(
				(m): m is { id: string; display_name?: string } =>
					typeof m.id === "string",
			)
			.map((m) => ({ id: m.id, label: m.display_name }));
		return { valid: true, models };
	},

	async generate(p: GenerateParams): Promise<string> {
		const r = await timedFetch(
			`${BASE}/messages`,
			{
				method: "POST",
				headers: {
					"x-api-key": p.key,
					"anthropic-version": VERSION,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					model: p.model,
					max_tokens: p.maxTokens ?? 1024,
					system: p.system,
					messages: [{ role: "user", content: p.prompt }],
				}),
			},
			30_000,
		);
		if (!r.ok) {
			throw new Error(`Anthropic API error: ${r.status}`);
		}
		const body = r.json as MessagesResponse;
		const text = body.content?.[0]?.text;
		if (!text) {
			throw new Error("Anthropic API: empty response");
		}
		return text;
	},
};
