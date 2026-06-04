import { z } from "zod";

const providerEnum = z.enum(["ANTHROPIC", "OPENAI"]);

export const aiConfigValidateSchema = z.object({
	provider: providerEnum,
	key: z.string().min(8, "Chave muito curta"),
});

export const aiConfigSaveSchema = z.object({
	provider: providerEnum,
	// Optional: when already configured, the stored key is reused (so the admin
	// can edit the model/prompt without re-pasting the key).
	key: z.string().min(8, "Chave muito curta").optional(),
	model: z.string().min(1, "Modelo é obrigatório"),
	systemPrompt: z.string().max(4000, "Prompt muito longo").optional(),
});

export type AiConfigValidateInput = z.infer<typeof aiConfigValidateSchema>;
export type AiConfigSaveInput = z.infer<typeof aiConfigSaveSchema>;
