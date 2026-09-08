/**
 * Deep-mocked Prisma client for unit tests that exercise services/actions
 * without touching a real database.
 *
 * Usage in a test file:
 *
 *   vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
 *   import { prismaMock } from "@/test/prisma-mock";
 *
 *   beforeEach(() => resetPrismaMock());
 *
 * `vi.mock` calls are hoisted above imports by Vitest, so the mock factory
 * above must reference `prismaMock` as a plain identifier — it works because
 * this module is imported (and thus evaluated) before the mocked module is
 * first used inside a test.
 */
import { mockDeep, mockReset } from "vitest-mock-extended";
import type { PrismaClient } from "@/generated/prisma";

export const prismaMock = mockDeep<PrismaClient>();

/** Call from `beforeEach` to clear call history and reset return values. */
export function resetPrismaMock() {
	mockReset(prismaMock);
}
