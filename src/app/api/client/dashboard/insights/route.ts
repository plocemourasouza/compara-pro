import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { buildDashboardInsights } from "@/lib/services/dashboard-insights";

export async function GET() {
	try {
		const user = await requireAuth(["CLIENT", "ADMIN"]);
		const clientCompanyId = user.company?.id ?? "";

		const insights = await buildDashboardInsights({
			kind: "client",
			clientCompanyId,
		});

		return NextResponse.json({
			success: true,
			insights,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Client dashboard insights error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
