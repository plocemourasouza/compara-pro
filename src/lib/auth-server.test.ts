import { beforeEach, describe, expect, it, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => ({
		get: () => ({ value: "tok" }),
	})),
}));
vi.mock("@/lib/auth", () => ({
	verifyToken: vi.fn(() => ({ userId: "u1" })),
}));

const { getCurrentUser } = await import("./auth-server");

function sessionRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "u1",
		name: "Ana Lima",
		email: "ana@mercado-norte.example",
		phone: null,
		avatarUrl: null,
		preferences: null,
		deletedAt: null,
		company: { id: "c1", name: "Mercado Norte", type: "CLIENT" },
		...overrides,
	};
}

describe("getCurrentUser", () => {
	beforeEach(() => {
		resetPrismaMock();
	});

	it("devolve a área do cliente ativo", async () => {
		prismaMock.user.findUnique.mockResolvedValue(sessionRow() as never);

		const user = await getCurrentUser();

		expect(user?.area).toBe("CLIENT");
		expect(user).not.toHaveProperty("deletedAt");
	});

	it("trata operador sem empresa como admin", async () => {
		prismaMock.user.findUnique.mockResolvedValue(
			sessionRow({ company: null }) as never,
		);

		const user = await getCurrentUser();

		expect(user?.area).toBe("ADMIN");
	});

	it("não autentica conta desativada", async () => {
		prismaMock.user.findUnique.mockResolvedValue(
			sessionRow({ deletedAt: new Date() }) as never,
		);

		expect(await getCurrentUser()).toBeNull();
	});

	it("não autentica usuário preso a um catálogo de fornecedor", async () => {
		prismaMock.user.findUnique.mockResolvedValue(
			sessionRow({
				company: { id: "s1", name: "Atacado Sul", type: "SUPPLIER" },
			}) as never,
		);

		expect(await getCurrentUser()).toBeNull();
	});
});
