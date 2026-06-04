import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import {
	decryptSecret,
	encryptSecret,
	isEncryptionConfigured,
	keyHint,
} from "./secret-box";

beforeAll(() => {
	// 32-byte key (base64) — getKey() reads this lazily at call time.
	process.env.AI_CONFIG_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("secret-box", () => {
	it("round-trips a secret", () => {
		const plain = "sk-ant-test-1234567890";
		const enc = encryptSecret(plain);
		expect(enc).not.toContain(plain);
		expect(enc.split(":")).toHaveLength(3);
		expect(decryptSecret(enc)).toBe(plain);
	});

	it("produces a different ciphertext each time (random IV)", () => {
		const a = encryptSecret("same-value");
		const b = encryptSecret("same-value");
		expect(a).not.toBe(b);
		expect(decryptSecret(a)).toBe("same-value");
		expect(decryptSecret(b)).toBe("same-value");
	});

	it("rejects tampered ciphertext (GCM auth tag)", () => {
		const enc = encryptSecret("secret-value");
		const parts = enc.split(":");
		const tampered = `${parts[0]}:${parts[1]}:${Buffer.from("garbage").toString("base64")}`;
		expect(() => decryptSecret(tampered)).toThrow();
	});

	it("keyHint exposes only the last 4 chars", () => {
		expect(keyHint("abcdef1234")).toBe("...1234");
	});

	it("isEncryptionConfigured is true with a valid 32-byte key", () => {
		expect(isEncryptionConfigured()).toBe(true);
	});
});
