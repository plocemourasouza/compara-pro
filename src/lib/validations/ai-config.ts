import { z } from "zod";

const providerEnum = z.enum(["ANTHROPIC", "OPENAI"]);

export const aiConfigValidateSchema = z.object({
	provider: providerEnum,
	key: z.string().min(8, "Chave muito curta"),
});

export const aiConfigSaveSchema = z.object({
	provider: providerEnum,
	key: z.string().min(8, "Chave muito curta"),
	model: z.string().min(1, "Modelo é obrigatório"),
});

export type AiConfigValidateInput = z.infer<typeof aiConfigValidateSchema>;
export type AiConfigSaveInput = z.infer<typeof aiConfigSaveSchema>;
