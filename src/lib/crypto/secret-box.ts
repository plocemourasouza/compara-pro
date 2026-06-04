import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM secret box for encrypting provider API keys at rest.
 * The encryption key comes from AI_CONFIG_ENCRYPTION_KEY (32 bytes, base64 or hex).
 * Fail-secure: any encrypt/decrypt throws if the key is missing or malformed.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
	const raw = process.env.AI_CONFIG_ENCRYPTION_KEY;
	if (!raw) {
		throw new Error(
			"AI_CONFIG_ENCRYPTION_KEY environment variable is required",
		);
	}
	const key = /^[0-9a-fA-F]{64}$/.test(raw)
		? Buffer.from(raw, "hex")
		: Buffer.from(raw, "base64");
	if (key.length !== 32) {
		throw new Error(
			"AI_CONFIG_ENCRYPTION_KEY must decode to 32 bytes (e.g. `openssl rand -base64 32`)",
		);
	}
	return key;
}

/** True when a valid 32-byte encryption key is configured. */
export function isEncryptionConfigured(): boolean {
	try {
		getKey();
		return true;
	} catch {
		return false;
	}
}

/** Encrypt a plaintext secret → "iv:tag:ciphertext" (all base64). */
export function encryptSecret(plain: string): string {
	const key = getKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const ciphertext = Buffer.concat([
		cipher.update(plain, "utf8"),
		cipher.final(),
	]);
	const tag = cipher.getAuthTag();
	return [
		iv.toString("base64"),
		tag.toString("base64"),
		ciphertext.toString("base64"),
	].join(":");
}

/** Decrypt an "iv:tag:ciphertext" payload. Throws on tamper (GCM auth) or bad key. */
export function decryptSecret(payload: string): string {
	const key = getKey();
	const parts = payload.split(":");
	if (parts.length !== 3) {
		throw new Error("Invalid encrypted payload format");
	}
	const iv = Buffer.from(parts[0] ?? "", "base64");
	const tag = Buffer.from(parts[1] ?? "", "base64");
	const data = Buffer.from(parts[2] ?? "", "base64");
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(tag);
	return Buffer.concat([decipher.update(data), decipher.final()]).toString(
		"utf8",
	);
}

/** A safe-to-display hint of a secret (last 4 chars only). */
export function keyHint(plain: string): string {
	return `...${plain.slice(-4)}`;
}
