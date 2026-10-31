import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeUser } from "@/test/auth-mock";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth-scope", () => ({
	getRepresentedSupplierIds: vi.fn(async () => ["sup-1"]),
	scopedSupplierIds: vi.fn(async () => ["sup-1"]),
}));
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
		new Request("http://localhost/api/supplier/clients", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		}),
	);
}

const body = {
	supplierCompanyId: "sup-1",
	companyName: "Loja alterada",
	cnpj: "44.444.444/0001-91",
	userName: "Ana Lima",
	userEmail: "ana@loja.example",
};

describe("POST /api/supplier/clients", () => {
	beforeEach(() => {
		resetPrismaMock();
		vi.mocked(requireAuth).mockResolvedValue(
			fakeUser("REPRESENTATIVE", "agency-1") as never,
		);
	});

	it("não reescreve nem vincula cliente que a agência não atende", async () => {
		prismaMock.company.findFirst.mockResolvedValue({
			id: "client-1",
			type: "CLIENT",
			name: "Loja Demo",
		} as never);
		prismaMock.supplierClient.findUnique.mockResolvedValue(null);
		prismaMock.supplierClient.findFirst.mockResolvedValue(null);
		prismaMock.supplierLinkRequest.findFirst.mockResolvedValue(null);

		const response = await post(body);

		expect(response.status).toBe(403);
		expect(prismaMock.company.update).not.toHaveBeenCalled();
		expect(prismaMock.supplierClient.create).not.toHaveBeenCalled();
		expect(prismaMock.user.create).not.toHaveBeenCalled();
	});

	it("vincula cliente já atendido pela agência sem alterar o cadastro", async () => {
		prismaMock.company.findFirst.mockResolvedValue({
			id: "client-1",
			type: "CLIENT",
			name: "Loja Demo",
		} as never);
		prismaMock.supplierClient.findUnique.mockResolvedValue(null);
		prismaMock.supplierClient.findFirst.mockResolvedValue({
			id: "link-existente",
		} as never);
		prismaMock.user.findUnique.mockResolvedValue({
			id: "u-existente",
		} as never);

		const response = await post(body);

		expect(response.status).toBe(201);
		expect(prismaMock.company.update).not.toHaveBeenCalled();
		expect(prismaMock.supplierClient.create).toHaveBeenCalledWith({
			data: {
				supplierCompanyId: "sup-1",
				clientCompanyId: "client-1",
				representativeCompanyId: "agency-1",
			},
		});
	});
});
