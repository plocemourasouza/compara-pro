import { describe, expect, it } from "vitest";
import { aiConfigSaveSchema, aiConfigValidateSchema } from "./ai-config";

describe("aiConfigSaveSchema", () => {
	it("accepts a full config with key", () => {
		const ok = aiConfigSaveSchema.safeParse({
			provider: "OPENAI",
			key: "sk-12345678",
			model: "gpt-4o",
			systemPrompt: "instruções",
		});
		expect(ok.success).toBe(true);
	});

	it("accepts a config without key (reuse stored key)", () => {
		const ok = aiConfigSaveSchema.safeParse({
			provider: "ANTHROPIC",
			model: "claude-x",
		});
		expect(ok.success).toBe(true);
	});

	it("rejects an unknown provider", () => {
		const bad = aiConfigSaveSchema.safeParse({
			provider: "GOOGLE",
			model: "gemini",
		});
		expect(bad.success).toBe(false);
	});

	it("rejects a too-short key", () => {
		const bad = aiConfigSaveSchema.safeParse({
			provider: "OPENAI",
			key: "short",
			model: "gpt-4o",
		});
		expect(bad.success).toBe(false);
	});

	it("rejects a missing model", () => {
		const bad = aiConfigSaveSchema.safeParse({ provider: "OPENAI" });
		expect(bad.success).toBe(false);
	});
});

describe("aiConfigValidateSchema", () => {
	it("requires provider and a key of at least 8 chars", () => {
		expect(
			aiConfigValidateSchema.safeParse({
				provider: "OPENAI",
				key: "sk-12345678",
			}).success,
		).toBe(true);
		expect(
			aiConfigValidateSchema.safeParse({ provider: "OPENAI", key: "x" })
				.success,
		).toBe(false);
	});
});
