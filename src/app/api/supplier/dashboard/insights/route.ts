import { NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { buildDashboardInsights } from "@/lib/services/dashboard-insights";

export async function GET() {
	try {
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const supplierCompanyIds = await getRepresentedSupplierIds(user);

		const insights = await buildDashboardInsights({
			kind: "representative",
			supplierCompanyIds,
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
		console.error("Supplier dashboard insights error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
