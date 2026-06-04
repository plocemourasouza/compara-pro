import { anthropicProvider } from "./anthropic-provider";
import { openaiProvider } from "./openai-provider";
import type { AiProvider, AiProviderId } from "./types";

export const SUPPORTED_PROVIDERS: { id: AiProviderId; label: string }[] = [
	{ id: "ANTHROPIC", label: "Anthropic (Claude)" },
	{ id: "OPENAI", label: "OpenAI" },
];

export function getProvider(id: AiProviderId): AiProvider {
	switch (id) {
		case "ANTHROPIC":
			return anthropicProvider;
		case "OPENAI":
			return openaiProvider;
	}
}
