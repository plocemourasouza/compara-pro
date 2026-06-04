import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

// Rotas que requerem autenticação
const protectedRoutes = [
	"/admin",
	"/supplier",
	"/client",
	"/dashboard",
	"/api/admin",
	"/api/compare",
	"/api/upload",
	"/api/pre-order",
	"/api/notifications",
];

// Rotas públicas (não requerem autenticação)
const publicRoutes = [
	"/",
	"/auth/login",
	"/auth/register",
	"/api/auth/login",
	"/api/auth/register",
	"/api/companies",
	"/api/products",
	"/favicon.ico",
	"/_next",
	"/public",
];

const JWT_SECRET = process.env.JWT_SECRET;
const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	// Permitir rotas públicas
	if (publicRoutes.some((route) => pathname.startsWith(route))) {
		return NextResponse.next();
	}

	// Verificar se é uma rota protegida
	const isProtectedRoute = protectedRoutes.some((route) =>
		pathname.startsWith(route),
	);

	if (!isProtectedRoute) {
		return NextResponse.next();
	}

	// Fail closed: page routes redirect to login, API routes return 401.
	const deny = (): NextResponse => {
		if (!pathname.startsWith("/api/")) {
			const loginUrl = new URL("/auth/login", request.url);
			loginUrl.searchParams.set("redirect", pathname);
			return NextResponse.redirect(loginUrl);
		}
		return NextResponse.json(
			{ error: "Token de autenticação necessário" },
			{ status: 401 },
		);
	};

	const token =
		request.cookies.get("auth_token")?.value ||
		request.headers.get("authorization")?.replace("Bearer ", "");

	if (!token || !secretKey) {
		return deny();
	}

	try {
		// jose verifies on the Edge runtime; jsonwebtoken relies on node:crypto
		// and does not work here. Pin HS256 to avoid algorithm confusion.
		const { payload } = await jwtVerify(token, secretKey, {
			algorithms: ["HS256"],
		});

		const requestHeaders = new Headers(request.headers);
		if (payload.userId) {
			requestHeaders.set("x-user-id", String(payload.userId));
		}

		return NextResponse.next({ request: { headers: requestHeaders } });
	} catch (error) {
		console.error("Token verification failed:", error);
		return deny();
	}
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|public).*)",
	],
};
