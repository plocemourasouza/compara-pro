import { randomInt } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth";

/** Validade do código de primeiro acesso (7 dias). */
export const ACTIVATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Gera um código numérico de 6 dígitos (com zeros à esquerda). */
export function generateActivationCode(): string {
	return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Hash do código (reusa bcrypt do auth). */
export function hashActivationCode(code: string): Promise<string> {
	return hashPassword(code);
}

/** Compara código informado com o hash salvo. */
export function verifyActivationCode(
	code: string,
	hash: string,
): Promise<boolean> {
	return verifyPassword(code, hash);
}

/** Data de expiração a partir de agora. */
export function activationExpiry(from: Date = new Date()): Date {
	return new Date(from.getTime() + ACTIVATION_TTL_MS);
}

/** Link da tela de primeiro acesso. */
export function buildActivationLink(): string {
	const base = process.env.APP_URL ?? "http://localhost:3000";
	return `${base}/auth/primeiro-acesso`;
}
