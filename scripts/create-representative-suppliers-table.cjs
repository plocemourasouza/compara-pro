/**
 * Cria a tabela representative_suppliers (model RepresentativeSupplier) via DDL
 * idempotente. Fallback para ambientes onde `prisma db push` não roda o
 * schema-engine. Em ambientes com db push funcional, use `npx prisma db push`.
 *
 * Run:  node scripts/create-representative-suppliers-table.cjs
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	await prisma.$executeRawUnsafe(`
		CREATE TABLE IF NOT EXISTS "representative_suppliers" (
			"id" TEXT NOT NULL,
			"representativeId" TEXT NOT NULL,
			"supplierCompanyId" TEXT NOT NULL,
			"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
			CONSTRAINT "representative_suppliers_pkey" PRIMARY KEY ("id")
		);`);
	await prisma.$executeRawUnsafe(
		`CREATE UNIQUE INDEX IF NOT EXISTS "representative_suppliers_representativeId_supplierCompanyId_key" ON "representative_suppliers"("representativeId","supplierCompanyId");`,
	);
	await prisma.$executeRawUnsafe(
		`CREATE INDEX IF NOT EXISTS "representative_suppliers_representativeId_idx" ON "representative_suppliers"("representativeId");`,
	);
	await prisma.$executeRawUnsafe(
		`CREATE INDEX IF NOT EXISTS "representative_suppliers_supplierCompanyId_idx" ON "representative_suppliers"("supplierCompanyId");`,
	);
	await prisma.$executeRawUnsafe(`DO $$ BEGIN
		IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='representative_suppliers_representativeId_fkey') THEN
			ALTER TABLE "representative_suppliers" ADD CONSTRAINT "representative_suppliers_representativeId_fkey" FOREIGN KEY ("representativeId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
		END IF;
		IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='representative_suppliers_supplierCompanyId_fkey') THEN
			ALTER TABLE "representative_suppliers" ADD CONSTRAINT "representative_suppliers_supplierCompanyId_fkey" FOREIGN KEY ("supplierCompanyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
		END IF;
	END $$;`);
	console.log("Tabela representative_suppliers pronta.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
