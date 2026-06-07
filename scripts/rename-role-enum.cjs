/**
 * Renomeia o valor do enum Role de SUPPLIER -> REPRESENTATIVE preservando as linhas.
 * Idempotente: só renomeia se o valor 'SUPPLIER' ainda existir no tipo "Role".
 *
 * DEVE rodar ANTES de `prisma db push` em bases existentes — o push trataria o
 * rename como drop+create do enum (destrutivo). Em base nova é no-op.
 *
 * Run:  node scripts/rename-role-enum.cjs
 */
require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	await prisma.$executeRawUnsafe(`
		DO $$
		BEGIN
			IF EXISTS (
				SELECT 1 FROM pg_enum e
				JOIN pg_type t ON e.enumtypid = t.oid
				WHERE t.typname = 'Role' AND e.enumlabel = 'SUPPLIER'
			) THEN
				ALTER TYPE "Role" RENAME VALUE 'SUPPLIER' TO 'REPRESENTATIVE';
			END IF;
		END$$;
	`);
	console.log("Role enum: SUPPLIER -> REPRESENTATIVE (ou já renomeado).");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
