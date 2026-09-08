import { jwtVerify } from "jose";
import { type NextRequest, NextResponse } from "next/server";

// Rotas de página que requerem autenticação (prefixo).
const protectedPageRoutes = ["/admin", "/supplier", "/client", "/dashboard"];

// Rotas de página públicas (não requerem autenticação).
const publicPageRoutes = [
	"/",
	"/auth/login",
	"/auth/register",
	"/favicon.ico",
	"/_next",
	"/public",
];

// Toda rota /api/* é protegida por padrão (fail closed) — só escapa disso
// quem estiver nesta allowlist explícita. Antes, a proteção de /api/* era
// uma lista de prefixos que precisava listar cada rota nova; qualquer rota
// esquecida passava sem checagem no proxy (os handlers ainda validavam,
// 52 de 54 chamam requireAuth/getCurrentUser, mas a borda não).
//
// Hoje só entram aqui as duas rotas de auth legadas — stubs desativados que
// respondem 410 incondicionalmente para qualquer chamada, sem checar sessão.
// Não são endpoints públicos "vivos": o fluxo real de login/registro é
// loginAction/registerAction (Server Actions em src/lib/actions/auth.ts,
// que fazem POST à página /auth/login, não a /api/*). Continuam na
// allowlist só para não herdar autenticação que não fariam sentido nelas.
//
// /api/companies e /api/products também estavam na lista pública antiga, mas
// os handlers já chamam getCurrentUser() e devolvem 401 sem sessão — não são
// genuinamente públicos, então ficam de fora: o proxy passa a barrar na
// borda o que o handler já barrava.
const PUBLIC_API = ["/api/auth/login", "/api/auth/register"];

const JWT_SECRET = process.env.JWT_SECRET;
const secretKey = JWT_SECRET ? new TextEncoder().encode(JWT_SECRET) : null;

// Fail closed: page routes redirect to login, API routes return 401.
function deny(request: NextRequest, pathname: string): NextResponse {
	if (!pathname.startsWith("/api/")) {
		const loginUrl = new URL("/auth/login", request.url);
		loginUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(loginUrl);
	}
	return NextResponse.json(
		{ error: "Token de autenticação necessário" },
		{ status: 401 },
	);
}

async function authenticate(
	request: NextRequest,
	pathname: string,
): Promise<NextResponse> {
	const token =
		request.cookies.get("auth_token")?.value ||
		request.headers.get("authorization")?.replace("Bearer ", "");

	if (!token || !secretKey) {
		return deny(request, pathname);
	}

	try {
		// jose verifies on the Edge runtime; jsonwebtoken relies on node:crypto
		// and does not work here. Pin HS256 to avoid algorithm confusion.
		const { payload } = await jwtVerify(token, secretKey, {
			algorithms: ["HS256"],
		});

		const requestHeaders = new Headers(request.headers);
		// Apaga antes de escrever: sem o delete, um token válido sem `userId`
		// deixaria passar o x-user-id que o cliente mandou. Nenhum handler lê
		// esse header hoje, mas ele não pode ser uma entrada controlável.
		requestHeaders.delete("x-user-id");
		if (payload.userId) {
			requestHeaders.set("x-user-id", String(payload.userId));
		}

		return NextResponse.next({ request: { headers: requestHeaders } });
	} catch (error) {
		console.error("Token verification failed:", error);
		return deny(request, pathname);
	}
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/api/")) {
		// Match exato: com startsWith, uma rota futura como /api/auth/login-sso
		// herdaria o acesso público sem ninguém perceber.
		const isPublicApi = PUBLIC_API.includes(pathname);
		if (isPublicApi) {
			return NextResponse.next();
		}
		return authenticate(request, pathname);
	}

	// Permitir rotas de página públicas. "/" deve casar exato — startsWith("/")
	// seria sempre verdadeiro e desativaria o proxy para todas as rotas.
	const isPublicPage = publicPageRoutes.some((route) =>
		route === "/" ? pathname === "/" : pathname.startsWith(route),
	);
	if (isPublicPage) {
		return NextResponse.next();
	}

	const isProtectedPage = protectedPageRoutes.some((route) =>
		pathname.startsWith(route),
	);
	if (!isProtectedPage) {
		return NextResponse.next();
	}

	return authenticate(request, pathname);
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
