import { type NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { LookupError, lookupCnpj } from "@/lib/services/company-lookup";

type RouteParams = { params: Promise<{ cnpj: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const { cnpj } = await params;
	try {
		await requireAuth(["ADMIN"]);
		const data = await lookupCnpj(cnpj);
		return NextResponse.json(data);
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		if (error instanceof LookupError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("CNPJ lookup error:", error);
		return NextResponse.json(
			{ error: "Erro ao consultar o CNPJ" },
			{ status: 500 },
		);
	}
}
