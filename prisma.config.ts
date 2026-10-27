import "dotenv/config";
import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * migrate deploy precisa da conexão direta (Supabase :5432).
 * O pooler (:6543) trava ou demora demais no build da Vercel.
 * Runtime da app continua em DATABASE_URL (pode ser pooled) via src/lib/db.ts.
 */
function datasourceUrl(): string {
	const direct = process.env.DIRECT_URL?.trim();
	const pooled = process.env.DATABASE_URL?.trim();
	const url = direct || pooled;

	if (!url) {
		throw new Error(
			"Defina DATABASE_URL. Em deploy com pooler Supabase, defina também DIRECT_URL (:5432).",
		);
	}

	const usingPoolerOnly = !direct && /pooler\.supabase\.com|:6543\b/i.test(url);
	if (usingPoolerOnly) {
		throw new Error(
			"DATABASE_URL está no pooler (:6543). Defina DIRECT_URL com a connection string Direct do Supabase (db.*.supabase.co:5432) para o migrate deploy.",
		);
	}

	return url;
}

export default defineConfig({
	schema: path.join("prisma", "schema.prisma"),
	migrations: {
		path: path.join("prisma", "migrations"),
	},
	datasource: {
		url: datasourceUrl(),
	},
});
