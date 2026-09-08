/**
 * Test double matching the exact return shape of `getCurrentUser`
 * (src/lib/auth-server.ts) — select clause + the derived `area` field.
 * Keep this in sync with that function's Prisma `select`.
 *
 * There is no `User.role`. `area` is derived from `company.type` via
 * `areaOf` (src/lib/area.ts): no company → ADMIN, company.type CLIENT →
 * CLIENT, company.type REPRESENTATIVE → REPRESENTATIVE. SUPPLIER companies
 * are login-less catalogs, so a user's area is never "SUPPLIER" — reject it
 * at the type level instead of at the call site.
 */
import type { Area } from "@/lib/area";

export interface FakeUser {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	avatarUrl: string | null;
	preferences: unknown;
	company: { id: string; name: string; type: string } | null;
	area: Area;
}

/** Build a fake `getCurrentUser()` result for a given area. */
export function fakeUser(area: Area, companyId = "company-1"): FakeUser {
	const company =
		area === "ADMIN"
			? null
			: { id: companyId, name: "Empresa de Teste", type: area };

	return {
		id: "user-1",
		name: "Usuário de Teste",
		email: "user@test.local",
		phone: null,
		avatarUrl: null,
		preferences: null,
		company,
		area,
	};
}
