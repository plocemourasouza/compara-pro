/**
 * Static guard — every API route handler outside a tiny, verified allowlist
 * must call the auth gate.
 *
 * This is a pure fs/text-scan check (no Prisma mock needed), consistent
 * with the project's existing testing convention (pure functions only).
 *
 * The negative case: a `route.ts` file added later that forgets to call
 * `requireAuth`/`getCurrentUser` (or, for the one legacy handler that
 * predates that helper, `verifyToken`) would fail this test — the failure
 * message lists the offending file so it is obvious what to fix.
 *
 * Allowlist, verified by reading each file (not assumed):
 *  - auth/login/route.ts, auth/register/route.ts: both handlers are
 *    disabled (return HTTP 410 unconditionally) — the real login/register
 *    flow is the `loginAction`/`registerAction` Server Actions. Genuinely
 *    public because they do nothing.
 *  - No third public handler was found; `compare/route.ts` looked
 *    unguarded by `requireAuth`/`getCurrentUser` but reads and validates a
 *    Bearer token via `verifyToken` itself (a pre-`requireAuth` auth
 *    pattern) — it is guarded, just not through the newer helper, so the
 *    detector below accepts `verifyToken(` as an equivalent gate rather
 *    than allowlisting it as public.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const API_ROOT = join(process.cwd(), "src/app/api");

const PUBLIC_ALLOWLIST = new Set([
	"auth/login/route.ts",
	"auth/register/route.ts",
]);

const AUTH_GATE_PATTERN = /requireAuth\(|getCurrentUser\(|verifyToken\(/;

function findRouteFiles(dir: string): string[] {
	const entries = readdirSync(dir);
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			files.push(...findRouteFiles(fullPath));
		} else if (entry === "route.ts") {
			files.push(fullPath);
		}
	}

	return files;
}

describe("API route handlers call the auth gate", () => {
	it("every route.ts outside the verified public allowlist calls requireAuth/getCurrentUser/verifyToken", () => {
		const routeFiles = findRouteFiles(API_ROOT);
		const offenders: string[] = [];
		let guardedCount = 0;
		let publicCount = 0;

		for (const filePath of routeFiles) {
			const relPath = relative(API_ROOT, filePath);
			const source = readFileSync(filePath, "utf-8");

			if (PUBLIC_ALLOWLIST.has(relPath)) {
				publicCount++;
				continue;
			}

			if (AUTH_GATE_PATTERN.test(source)) {
				guardedCount++;
			} else {
				offenders.push(relPath);
			}
		}

		console.log(
			`auth-guard tally: ${guardedCount} guarded / ${publicCount} public / ${routeFiles.length} total`,
		);

		expect(
			offenders,
			`Unguarded route handlers: ${offenders.join(", ")}`,
		).toEqual([]);
	});

	it("the public allowlist only contains files that actually exist under src/app/api", () => {
		for (const relPath of PUBLIC_ALLOWLIST) {
			expect(() => statSync(join(API_ROOT, relPath))).not.toThrow();
		}
	});
});
