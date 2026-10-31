import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/test/auth-mock";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth-server", () => ({
	requireAuth: vi.fn(),
	AuthError: class AuthError extends Error {
		status: number;
		constructor(message: string, status: number) {
			super(message);
			this.status = status;
		}
	},
}));

const { requireAuth } = await import("@/lib/auth-server");
const { POST } = await import("./route");

function post(body: unknown) {
	return POST(
		new Request("http://localhost/api/representative/suppliers", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

describe("POST /api/representative/suppliers", () => {
	beforeEach(() => {
		resetPrismaMock();
		vi.mocked(requireAuth).mockResolvedValue(
			fakeUser("REPRESENTATIVE", "agency-1") as never,
		);
	});

	it("não reivindica nem reescreve fornecedor de outra agência", async () => {
		prismaMock.company.findFirst.mockResolvedValue({
			id: "sup-1",
			type: "SUPPLIER",
			name: "Fornecedor Beta",
		} as never);

		const response = await post({
			name: "Fornecedor Beta alterado",
			cnpj: "22.222.222/0001-91",
		});

		expect(response.status).toBe(409);
		expect(prismaMock.company.update).not.toHaveBeenCalled();
		expect(prismaMock.company.create).not.toHaveBeenCalled();
		expect(prismaMock.representativeSupplier.upsert).not.toHaveBeenCalled();
	});

	it("cria fornecedor novo e vincula à agência", async () => {
		prismaMock.company.findFirst.mockResolvedValue(null);
		prismaMock.company.create.mockResolvedValue({
			id: "sup-new",
			name: "Fornecedor Novo",
		} as never);

		const response = await post({ name: "Fornecedor Novo" });

		expect(response.status).toBe(201);
		expect(prismaMock.company.create).toHaveBeenCalled();
		expect(prismaMock.representativeSupplier.upsert).toHaveBeenCalled();
	});

	it("reapresentar o próprio fornecedor não altera o cadastro", async () => {
		prismaMock.company.findFirst.mockResolvedValue({
			id: "sup-1",
			type: "SUPPLIER",
			name: "Fornecedor Alfa",
		} as never);
		prismaMock.representativeSupplier.findUnique.mockResolvedValue({
			id: "link-1",
		} as never);

		const response = await post({
			name: "Nome diferente",
			cnpj: "11.111.111/0001-91",
		});

		expect(response.status).toBe(201);
		expect(prismaMock.company.update).not.toHaveBeenCalled();
		expect(prismaMock.representativeSupplier.upsert).toHaveBeenCalled();
	});
});
