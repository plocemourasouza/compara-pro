import { type NextRequest, NextResponse } from "next/server";
import { canRevealCnpj } from "@/lib/auth-scope";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatters } from "@/lib/utils/masks";

// Revela o CNPJ completo (formatado) sob demanda — o CNPJ é exibido anonimizado
// por LGPD em todas as listas. A revelação exige vínculo (canRevealCnpj): admin
// irrestrito; representante/cliente só de empresas que representam/atendem.
// Nunca devolve nada além do CNPJ.
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		if (!(await canRevealCnpj(user, id))) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const company = await prisma.company.findFirst({
			where: { id, deletedAt: null },
			select: { cnpj: true },
		});

		if (!company) {
			return NextResponse.json({ error: "Company not found" }, { status: 404 });
		}

		return NextResponse.json({
			cnpj: company.cnpj ? formatters.cnpj(company.cnpj) : null,
		});
	} catch (error) {
		console.error("GET /api/companies/[id]/cnpj error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
