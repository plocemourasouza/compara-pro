import { decryptSecret, encryptSecret, keyHint } from "@/lib/crypto/secret-box";
import { prisma } from "@/lib/db";
import type { AiProviderId } from "./types";

const SINGLETON_ID = "singleton";

export interface AiConfigServer {
	provider: AiProviderId;
	model: string;
	key: string;
}

export interface AiConfigPublic {
	configured: boolean;
	provider: AiProviderId | null;
	model: string | null;
	keyHint: string | null;
}

/** Server-only: returns the decrypted key. NEVER expose this to the client. */
export async function getAiConfigForServer(): Promise<AiConfigServer | null> {
	const row = await prisma.aiConfig.findUnique({ where: { id: SINGLETON_ID } });
	if (!row) {
		return null;
	}
	try {
		const key = decryptSecret(row.encryptedKey);
		return { provider: row.provider, model: row.model, key };
	} catch {
		// Missing/rotated encryption key → treat as not configured (graceful).
		return null;
	}
}

/** Safe DTO for the admin UI — no secret material. */
export async function getAiConfigPublic(): Promise<AiConfigPublic> {
	const row = await prisma.aiConfig.findUnique({ where: { id: SINGLETON_ID } });
	if (!row) {
		return { configured: false, provider: null, model: null, keyHint: null };
	}
	return {
		configured: true,
		provider: row.provider,
		model: row.model,
		keyHint: row.keyHint,
	};
}

export async function saveAiConfig(input: {
	provider: AiProviderId;
	key: string;
	model: string;
}): Promise<void> {
	const encryptedKey = encryptSecret(input.key);
	const hint = keyHint(input.key);
	await prisma.aiConfig.upsert({
		where: { id: SINGLETON_ID },
		create: {
			id: SINGLETON_ID,
			provider: input.provider,
			encryptedKey,
			keyHint: hint,
			model: input.model,
		},
		update: {
			provider: input.provider,
			encryptedKey,
			keyHint: hint,
			model: input.model,
		},
	});
}
