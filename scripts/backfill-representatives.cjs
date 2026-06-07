/**
 * Backfill: para cada representante (User role REPRESENTATIVE) com companyId de uma
 * Company type SUPPLIER, cria o vínculo RepresentativeSupplier (representa o seu
 * fornecedor atual). Idempotente via @@unique([representativeId, supplierCompanyId]).
 *
 * Rodar DEPOIS de `prisma db push` (tabela representative_suppliers já existe).
 *
 * Run:  node scripts/backfill-representatives.cjs
 */
require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
	const reps = await prisma.user.findMany({
		where: {
			role: "REPRESENTATIVE",
			companyId: { not: null },
			company: { type: "SUPPLIER" },
		},
		select: { id: true, companyId: true },
	});

	for (const r of reps) {
		await prisma.representativeSupplier.upsert({
			where: {
				representativeId_supplierCompanyId: {
					representativeId: r.id,
					supplierCompanyId: r.companyId,
				},
			},
			update: {},
			create: { representativeId: r.id, supplierCompanyId: r.companyId },
		});
	}
	console.log(`Backfill: ${reps.length} representante(s) processado(s).`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
