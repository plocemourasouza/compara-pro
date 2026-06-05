import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, preferencesSchema } from "./preferences";

describe("preferencesSchema", () => {
	it("accepts the default preferences", () => {
		expect(preferencesSchema.safeParse(DEFAULT_PREFERENCES).success).toBe(true);
	});

	it("rejects an invalid theme", () => {
		const bad = preferencesSchema.safeParse({
			...DEFAULT_PREFERENCES,
			theme: "neon",
		});
		expect(bad.success).toBe(false);
	});

	it("rejects a non-boolean flag", () => {
		const bad = preferencesSchema.safeParse({
			...DEFAULT_PREFERENCES,
			emailNotifications: "yes",
		});
		expect(bad.success).toBe(false);
	});

	it("rejects a missing field", () => {
		const { theme: _omit, ...bad } = DEFAULT_PREFERENCES;
		expect(preferencesSchema.safeParse(bad).success).toBe(false);
	});
});
