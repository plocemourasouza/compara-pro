import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma, Role } from "@/generated/prisma";
import {
	activationExpiry,
	buildActivationLink,
	generateActivationCode,
	hashActivationCode,
} from "@/lib/auth-activation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email/mailer";

const createUserSchema = z
	.object({
		name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
		email: z.string().email("Email inválido"),
		phone: z.string().min(1, "Telefone é obrigatório"),
		role: z.enum(["ADMIN", "SUPPLIER", "CLIENT"]),
		companyId: z.string().optional(),
		companyName: z.string().optional(),
	})
	.refine(
		(data) => {
			// Se role não é ADMIN, deve ter companyId ou companyName
			if (data.role !== "ADMIN") {
				return data.companyId || data.companyName;
			}
			return true;
		},
		{
			message: "Usuários não-admin devem ter uma empresa associada",
		},
	);

// GET /api/users - Listar usuários com paginação
export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser();

		if (user?.role !== "ADMIN") {
			return NextResponse.json(
				{ error: "Acesso negado. Apenas administradores podem acessar." },
				{ status: 403 },
			);
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);
		const search = searchParams.get("search") || "";
		const role = searchParams.get("role") || "all";
		const companyId = searchParams.get("companyId") || "";
		const status = searchParams.get("status") || "all"; // active, inactive, all

		const skip = (page - 1) * limit;

		// Construir filtros
		const where: Prisma.UserWhereInput = {};

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}

		if (role !== "all") {
			where.role = role as Role;
		}

		if (companyId) {
			where.companyId = companyId;
		}

		if (status === "active") {
			where.deletedAt = null;
		} else if (status === "inactive") {
			where.deletedAt = { not: null };
		}

		const [usersRaw, total] = await Promise.all([
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
					role: true,
					createdAt: true,
					updatedAt: true,
					deletedAt: true,
					password: true,
					company: {
						select: {
							id: true,
							name: true,
							type: true,
						},
					},
				},
			}),
			prisma.user.count({ where }),
		]);

		// pending = sem senha (primeiro acesso ainda não concluído). Nunca devolve o hash.
		const users = usersRaw.map(({ password, ...u }) => ({
			...u,
			pending: !password,
		}));

		return NextResponse.json({
			users,
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

		if (user?.role !== "ADMIN") {
			return NextResponse.json(
				{
					error: "Acesso negado. Apenas administradores podem criar usuários.",
				},
				{ status: 403 },
			);
		}

		const body = await request.json();
		const validationResult = createUserSchema.safeParse(body);

		if (!validationResult.success) {
			return NextResponse.json(
				{ error: "Dados inválidos", details: validationResult.error.issues },
				{ status: 400 },
			);
		}

		const { name, email, phone, role, companyId, companyName } =
			validationResult.data;

		// Verificar se email já existe
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return NextResponse.json(
				{ error: "Email já está em uso" },
				{ status: 409 },
			);
		}

		let finalCompanyId = companyId;

		// Se não tem companyId mas tem companyName, criar/buscar empresa
		if (!companyId && companyName && role !== "ADMIN") {
			let company = await prisma.company.findFirst({
				where: { name: companyName },
			});

			if (!company) {
				company = await prisma.company.create({
					data: {
						name: companyName,
						type: role === "SUPPLIER" ? "SUPPLIER" : "CLIENT",
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
				role,
				companyId: finalCompanyId || null,
				activationCodeHash,
				activationExpiresAt: activationExpiry(),
			},
			select: {
				id: true,
				name: true,
				email: true,
				phone: true,
				role: true,
				createdAt: true,
				company: {
					select: {
						id: true,
						name: true,
						type: true,
					},
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
