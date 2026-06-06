import { type NextRequest, NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { LookupError, lookupCep } from "@/lib/services/company-lookup";

type RouteParams = { params: Promise<{ cep: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
	const { cep } = await params;
	try {
		await requireAuth(["ADMIN"]);
		const data = await lookupCep(cep);
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
		console.error("CEP lookup error:", error);
		return NextResponse.json(
			{ error: "Erro ao consultar o CEP" },
			{ status: 500 },
		);
	}
}
