import { type NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatters } from "@/lib/utils/masks";

// Revela o CNPJ completo (formatado) sob demanda — usado pela ação de copiar na
// lista de representantes, onde o CNPJ é exibido anonimizado por LGPD.
// Nunca devolve nada além do CNPJ; gate ADMIN.
export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const user = await getCurrentUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		if (user.area !== "ADMIN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const { id } = await params;
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
