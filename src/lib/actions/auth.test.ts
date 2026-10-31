import { beforeEach, describe, expect, it, vi } from "vitest";
import { verifyPassword } from "@/lib/auth";
import { sendNotificationEmail } from "@/lib/email/mailer";
import { prismaMock, resetPrismaMock } from "@/test/prisma-mock";

const { cookieSet } = vi.hoisted(() => ({ cookieSet: vi.fn() }));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("next/headers", () => ({
	cookies: vi.fn(async () => ({ set: cookieSet, delete: vi.fn() })),
}));
vi.mock("@/lib/auth", () => ({
	generateToken: vi.fn(() => "token"),
	hashPassword: vi.fn(async () => "hashed"),
	verifyPassword: vi.fn(async () => true),
}));
vi.mock("@/lib/email/mailer", () => ({
	sendNotificationEmail: vi.fn(),
}));

const {
	activateAccountAction,
	loginAction,
	registerAction,
	resendActivationCodeAction,
} = await import("./auth");

function registerForm(role = "CLIENT", companyName = "Mercado Norte") {
	const form = new FormData();
	form.set("name", "Ana Lima");
	form.set("email", "ana@mercado-norte.example");
	form.set("password", "segredo");
	form.set("role", role);
	form.set("companyName", companyName);
	return form;
}

function loginForm() {
	const form = new FormData();
	form.set("email", "ana@mercado-norte.example");
	form.set("password", "segredo");
	return form;
}

describe("registerAction", () => {
	beforeEach(() => {
		resetPrismaMock();
		cookieSet.mockClear();
		prismaMock.user.findUnique.mockResolvedValue(null);
		prismaMock.user.count.mockResolvedValue(0);
	});

	it("recusa nome de empresa já usado e não cria usuário", async () => {
		prismaMock.company.findFirst.mockResolvedValue({
			id: "existente",
		} as never);

		const result = await registerAction(
			null,
			registerForm("CLIENT", "mercado norte"),
		);

		expect(result).toEqual({
			error:
				"Já existe uma empresa com esse nome. Peça um convite para entrar nela.",
		});
		expect(prismaMock.company.findFirst).toHaveBeenCalledWith({
			where: {
				name: { equals: "mercado norte", mode: "insensitive" },
			},
			select: { id: true },
		});
		expect(prismaMock.company.create).not.toHaveBeenCalled();
		expect(prismaMock.user.create).not.toHaveBeenCalled();
		expect(cookieSet).not.toHaveBeenCalled();
	});

	it("cria empresa nova do tipo CLIENT mesmo se o formulário pedir outro papel", async () => {
		prismaMock.company.findFirst.mockResolvedValue(null);
		prismaMock.company.create.mockResolvedValue({
			id: "nova",
			type: "CLIENT",
		} as never);
		prismaMock.user.create.mockResolvedValue({
			id: "u1",
			company: { type: "CLIENT" },
		} as never);

		const result = await registerAction(null, registerForm("ADMIN"));

		expect(prismaMock.company.create).toHaveBeenCalledWith({
			data: { name: "Mercado Norte", type: "CLIENT" },
		});
		expect(result).toEqual({ success: true, redirectUrl: "/client" });
		expect(cookieSet).toHaveBeenCalled();
	});
});

describe("loginAction", () => {
	beforeEach(() => {
		resetPrismaMock();
		cookieSet.mockClear();
	});

	it("não abre sessão para conta desativada", async () => {
		prismaMock.user.findUnique.mockResolvedValue({
			id: "u1",
			password: "hash",
			deletedAt: new Date(),
			company: { type: "CLIENT" },
		} as never);

		const result = await loginAction(null, loginForm());

		expect(result).toEqual({ error: "Conta desativada." });
		expect(cookieSet).not.toHaveBeenCalled();
	});

	it("não abre sessão quando a empresa não tem área de acesso", async () => {
		prismaMock.user.findUnique.mockResolvedValue({
			id: "u1",
			password: "hash",
			deletedAt: null,
			company: { type: "SUPPLIER" },
		} as never);

		const result = await loginAction(null, loginForm());

		expect(result).toEqual({
			error: "Esta conta não tem acesso à plataforma.",
		});
		expect(cookieSet).not.toHaveBeenCalled();
	});
});

function pendingUser(
	overrides: Record<string, unknown> = {},
): Record<string, unknown> {
	return {
		id: "u1",
		email: "ana@mercado-norte.example",
		password: null,
		activationCodeHash: "hash",
		activationExpiresAt: new Date(Date.now() + 60_000),
		activationFailedAttempts: 0,
		activationLockedUntil: null,
		deletedAt: null,
		company: { type: "CLIENT" },
		...overrides,
	};
}

function activateForm() {
	const form = new FormData();
	form.set("email", "ana@mercado-norte.example");
	form.set("code", "123456");
	form.set("password", "segredo");
	form.set("confirmPassword", "segredo");
	return form;
}

describe("activateAccountAction", () => {
	beforeEach(() => {
		resetPrismaMock();
		cookieSet.mockClear();
		vi.mocked(verifyPassword).mockClear();
		vi.mocked(verifyPassword).mockResolvedValue(true);
	});

	it("não compara o código enquanto a conta está bloqueada", async () => {
		prismaMock.user.findUnique.mockResolvedValue(
			pendingUser({
				activationLockedUntil: new Date(Date.now() + 60_000),
			}) as never,
		);

		const result = await activateAccountAction(null, activateForm());

		expect(result).toEqual({ error: "Código inválido ou expirado." });
		expect(verifyPassword).not.toHaveBeenCalled();
		expect(prismaMock.user.update).not.toHaveBeenCalled();
		expect(cookieSet).not.toHaveBeenCalled();
	});

	it("conta a tentativa errada e bloqueia na quinta", async () => {
		vi.mocked(verifyPassword).mockResolvedValue(false);
		prismaMock.user.findUnique.mockResolvedValue(
			pendingUser({ activationFailedAttempts: 4 }) as never,
		);

		const result = await activateAccountAction(null, activateForm());

		expect(result).toEqual({ error: "Código inválido ou expirado." });
		expect(prismaMock.user.update).toHaveBeenCalledWith({
			where: { id: "u1" },
			data: {
				activationFailedAttempts: 0,
				activationLockedUntil: expect.any(Date),
			},
		});
		expect(cookieSet).not.toHaveBeenCalled();
	});

	it("zera o contador quando o código é válido", async () => {
		prismaMock.user.findUnique.mockResolvedValue(pendingUser() as never);
		prismaMock.user.update.mockResolvedValue({} as never);

		const result = await activateAccountAction(null, activateForm());

		expect(result).toEqual({ success: true, redirectUrl: "/client" });
		expect(prismaMock.user.update).toHaveBeenCalledWith(
			expect.objectContaining({
				data: expect.objectContaining({
					activationFailedAttempts: 0,
					activationLockedUntil: null,
					activationCodeHash: null,
				}),
			}),
		);
	});
});

describe("resendActivationCodeAction", () => {
	beforeEach(() => {
		resetPrismaMock();
		vi.mocked(sendNotificationEmail).mockClear();
	});

	it("não gira o código nem envia e-mail acima do limite da janela", async () => {
		prismaMock.user.findUnique.mockResolvedValue({
			id: "u1",
			email: "ana@mercado-norte.example",
			password: null,
			activationLockedUntil: null,
			activationResendCount: 3,
			activationResendWindowStart: new Date(),
		} as never);

		const form = new FormData();
		form.set("email", "ana@mercado-norte.example");
		const result = await resendActivationCodeAction(null, form);

		expect(result).toEqual({
			success: true,
			message:
				"Se a conta existir e estiver pendente, enviamos um novo código por e-mail.",
		});
		expect(prismaMock.user.update).not.toHaveBeenCalled();
		expect(sendNotificationEmail).not.toHaveBeenCalled();
	});
});
