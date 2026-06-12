import { type NextRequest, NextResponse } from "next/server";
import { areaOf } from "@/lib/area";
import {
	activationExpiry,
	buildActivationLink,
	generateActivationCode,
	hashActivationCode,
} from "@/lib/auth-activation";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { sendNotificationEmail } from "@/lib/email/mailer";
import { canMutateTarget } from "@/lib/services/user-access";

type RouteParams = { params: Promise<{ id: string }> };

// POST /api/users/[id]/resend-activation — regenera o código de primeiro acesso.
// ADMIN (global) ou gestor da própria equipe (escopo via canMutateTarget).
export async function POST(_request: NextRequest, { params }: RouteParams) {
	const { id } = await params;
	try {
		const actor = await requireAuth(["ADMIN", "REPRESENTATIVE", "CLIENT"]);

		const target = await prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				email: true,
				password: true,
				companyId: true,
				company: { select: { type: true } },
			},
		});
		// Fora de escopo → 404 (não vaza existência).
		if (
			!target ||
			!canMutateTarget(
				actor,
				{ id: target.id, area: areaOf(target), companyId: target.companyId },
				"resend",
			)
		) {
			return NextResponse.json(
				{ error: "Usuário não encontrado" },
				{ status: 404 },
			);
		}
		if (target.password) {
			return NextResponse.json(
				{ error: "Usuário já está ativo" },
				{ status: 400 },
			);
		}

		const code = generateActivationCode();
		const activationCodeHash = await hashActivationCode(code);
		await prisma.user.update({
			where: { id },
			data: { activationCodeHash, activationExpiresAt: activationExpiry() },
		});

		const link = buildActivationLink();
		await sendNotificationEmail({
			to: [target.email],
			subject: "Seu código de primeiro acesso — Compara Pró",
			message: `Seu novo código de primeiro acesso é ${code}. Acesse ${link} para confirmar o código e definir sua senha. O código expira em 7 dias.`,
		});

		console.info(
			JSON.stringify({ action: "user.activation_resent", userId: target.id }),
		);

		return NextResponse.json({
			message: "Código reenviado",
			activation: { code, link },
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Resend activation error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
