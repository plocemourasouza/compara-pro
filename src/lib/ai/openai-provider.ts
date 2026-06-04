import { timedFetch } from "./http";
import type { AiProvider, GenerateParams, ValidateResult } from "./types";

const BASE = "https://api.openai.com/v1";

interface ModelsResponse {
	data?: Array<{ id?: string }>;
}
interface ChatResponse {
	choices?: Array<{ message?: { content?: string } }>;
}

const CHAT_PREFIXES = ["gpt-", "o1", "o3", "o4", "chatgpt"];

export const openaiProvider: AiProvider = {
	id: "OPENAI",

	async validateKey(key: string): Promise<ValidateResult> {
		const r = await timedFetch(
			`${BASE}/models`,
			{ headers: { authorization: `Bearer ${key}` } },
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
			.map((m) => m.id)
			.filter(
				(id): id is string =>
					typeof id === "string" &&
					CHAT_PREFIXES.some((prefix) => id.startsWith(prefix)),
			)
			.sort()
			.map((id) => ({ id }));
		return { valid: true, models };
	},

	async generate(p: GenerateParams): Promise<string> {
		const r = await timedFetch(
			`${BASE}/chat/completions`,
			{
				method: "POST",
				headers: {
					authorization: `Bearer ${p.key}`,
					"content-type": "application/json",
				},
				body: JSON.stringify({
					model: p.model,
					// Newer OpenAI models reject max_tokens; max_completion_tokens is the
					// forward-compatible replacement (also accepted by current chat models).
					max_completion_tokens: p.maxTokens ?? 1024,
					messages: [
						{ role: "system", content: p.system },
						{ role: "user", content: p.prompt },
					],
				}),
			},
			30_000,
		);
		if (!r.ok) {
			throw new Error(`OpenAI API error: ${r.status}`);
		}
		const body = r.json as ChatResponse;
		const text = body.choices?.[0]?.message?.content;
		if (!text) {
			throw new Error("OpenAI API: empty response");
		}
		return text;
	},
};
