import { NextResponse } from "next/server";

/**
 * Deprecated. Registration is handled by the `registerAction` Server Action in
 * `src/lib/actions/auth.ts`, which sets an httpOnly cookie. This route previously
 * returned the JWT in the response body (readable by any XSS) — a parallel,
 * insecure auth flow — and is intentionally disabled.
 */
export function POST() {
	return NextResponse.json(
		{ error: "Endpoint desativado. Use o fluxo de cadastro da aplicação." },
		{ status: 410 },
	);
}
