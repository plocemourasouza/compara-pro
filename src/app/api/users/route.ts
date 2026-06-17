import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma";
import { areaOf } from "@/lib/area";
import {
	activationExpiry,
	buildActivationLink,
	generateActivationCode,
	hashActivationCode,
} from "@/lib/auth-activation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email/mailer";
import {
	type AccessRole,
	resolveUserListScope,
	sanitizeUserCreate,
} from "@/lib/services/user-access";
import { normalizeUserData } from "@/lib/utils/normalize";

// Campos base (papel/empresa NÃO vêm do body para não-admin — são forçados
// pela camada de autorização). companyName/companyId só são honrados p/ ADMIN.
const baseUserSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("Email inválido"),
	phone: z.string().min(1, "Telefone é obrigatório"),
	companyId: z.string().optional(),
	companyName: z.string().optional(),
	role: z.enum(["ADMIN", "REPRESENTATIVE", "CLIENT"]).optional(),
});

const VALID_SCOPE_ROLES = ["ADMIN", "REPRESENTATIVE", "CLIENT"] as const;

function parseScopeRole(raw: string | null | undefined): AccessRole {
	return VALID_SCOPE_ROLES.includes(raw as AccessRole)
		? (raw as AccessRole)
		: "ADMIN";
}

// GET /api/users - Listar usuários (escopado por área + ator)
export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const scopeRole = parseScopeRole(searchParams.get("scopeRole"));
		const scope = resolveUserListScope(user, scopeRole);
		if ("forbidden" in scope) {
			return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
		}

		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);
		const search = searchParams.get("search") || "";
		const status = searchParams.get("status") || "all"; // active, inactive, all
		const skip = (page - 1) * limit;

		// Área e empresa são FORÇADAS pelo escopo (params do cliente não relaxam).
		// Área = company.type; ADMIN = sem empresa (companyId null).
		const where: Prisma.UserWhereInput = {};
		if (scope.role === "ADMIN") {
			where.companyId = null;
		} else {
			where.company = { type: scope.role };
			if (scope.companyId) where.companyId = scope.companyId;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}

		if (status === "active") {
			where.deletedAt = null;
		} else if (status === "inactive") {
			where.deletedAt = { not: null };
		}

		// stats restritos ao MESMO escopo (papel+empresa) — sem agregados globais
		// que vazariam contagens de outras empresas/papéis.
		const scopeWhere: Prisma.UserWhereInput = {};
		if (scope.role === "ADMIN") {
			scopeWhere.companyId = null;
		} else {
			scopeWhere.company = { type: scope.role };
			if (scope.companyId) scopeWhere.companyId = scope.companyId;
		}

		const [usersRaw, total, activeCount, inactiveCount] = await Promise.all([
			prisma.user.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					email: true,
					phone: true,
					createdAt: true,
					updatedAt: true,
					deletedAt: true,
					password: true,
					companyId: true,
					company: {
						select: { id: true, name: true, type: true },
					},
				},
			}),
			prisma.user.count({ where }),
			prisma.user.count({ where: { ...scopeWhere, deletedAt: null } }),
			prisma.user.count({ where: { ...scopeWhere, deletedAt: { not: null } } }),
		]);

		const stats = {
			total: activeCount + inactiveCount,
			active: activeCount,
			inactive: inactiveCount,
		};

		// pending = sem senha (primeiro acesso ainda não concluído). Nunca devolve o
		// hash. `area` derivada de company.type p/ exibição na lista.
		const users = usersRaw.map(({ password, ...u }) => ({
			...u,
			area: areaOf(u),
			pending: !password,
		}));

		return NextResponse.json({
			users,
			stats,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("List users error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// POST /api/users - Criar novo usuário (sem senha; ativação por código no 1º acesso)
export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser();
		if (!user) {
			return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
		}

		const body = await request.json();
		const parsed = baseUserSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Dados inválidos", details: parsed.error.issues },
				{ status: 400 },
			);
		}

		const { searchParams } = new URL(request.url);
		const scopeRole = parseScopeRole(searchParams.get("scopeRole"));

		// Autorização: papel/empresa forçados p/ não-admin; escalonamento bloqueado.
		const decision = sanitizeUserCreate(
			user,
			{
				role: parsed.data.role,
				companyId: parsed.data.companyId,
				companyName: parsed.data.companyName,
			},
			scopeRole,
		);
		if (!decision.ok) {
			return NextResponse.json(
				{ error: "Acesso negado", reason: decision.reason },
				{ status: 403 },
			);
		}

		const { name, email, phone, companyName } = normalizeUserData(parsed.data);
		const role = decision.role;

		// Usuário não-admin precisa de empresa (própria, p/ self-service; ou informada p/ admin).
		if (
			role !== "ADMIN" &&
			!decision.companyId &&
			!(decision.allowCompanyAutoCreate && companyName)
		) {
			return NextResponse.json(
				{ error: "Usuários não-admin devem ter uma empresa associada" },
				{ status: 400 },
			);
		}

		const existingUser = await prisma.user.findUnique({ where: { email } });
		if (existingUser) {
			return NextResponse.json(
				{ error: "Email já está em uso" },
				{ status: 409 },
			);
		}

		let finalCompanyId = decision.companyId;

		// Auto-criação de empresa por nome: SÓ admin (allowCompanyAutoCreate).
		if (
			decision.allowCompanyAutoCreate &&
			!finalCompanyId &&
			companyName &&
			role !== "ADMIN"
		) {
			let company = await prisma.company.findFirst({
				where: { name: companyName },
			});
			if (!company) {
				company = await prisma.company.create({
					data: {
						name: companyName,
						type: role === "REPRESENTATIVE" ? "REPRESENTATIVE" : "CLIENT",
					},
				});
			}
			finalCompanyId = company.id;
		}

		// Gera código de primeiro acesso (usuário criado SEM senha).
		const code = generateActivationCode();
		const activationCodeHash = await hashActivationCode(code);

		const newUser = await prisma.user.create({
			data: {
				name,
				email,
				phone,
				password: null,
				companyId: finalCompanyId || null,
				activationCodeHash,
				activationExpiresAt: activationExpiry(),
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				createdAt: true,
				company: {
					select: { id: true, name: true, type: true },
				},
			},
		});

		const link = buildActivationLink();

		// E-mail best-effort (no-op sem RESEND_API_KEY).
		await sendNotificationEmail({
			to: [email],
			subject: "Ative sua conta no Compara Pró",
			message: `Seu código de primeiro acesso é ${code}. Acesse ${link} para confirmar o código e definir sua senha. O código expira em 7 dias.`,
		});

		// Log sem PII (não registra e-mail nem código).
		console.info(
			JSON.stringify({
				action: "user.activation_generated",
				userId: newUser.id,
			}),
		);

		return NextResponse.json(
			{
				message: "Usuário criado com sucesso",
				user: newUser,
				activation: { code, link },
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Create user error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
