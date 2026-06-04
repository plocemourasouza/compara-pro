export type AiProviderId = "ANTHROPIC" | "OPENAI";

export interface AiModelInfo {
	id: string;
	label?: string;
}

export interface ValidateResult {
	valid: boolean;
	models: AiModelInfo[];
	error?: string;
}

export interface GenerateParams {
	system: string;
	prompt: string;
	model: string;
	key: string;
	maxTokens?: number;
}

export interface AiProvider {
	readonly id: AiProviderId;
	validateKey(key: string): Promise<ValidateResult>;
	generate(params: GenerateParams): Promise<string>;
}
