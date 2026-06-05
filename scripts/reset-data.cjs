/**
 * Reset transacional dos dados (POC). Mantém o admin + ai_config.
 * Use antes de migrar o schema do produto e re-seedar (F6).
 *   node scripts/reset-data.cjs
 */
require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

(async () => {
	try {
		await prisma.supplierMatch.deleteMany();
		await prisma.preOrderItem.deleteMany();
		await prisma.preOrder.deleteMany();
		await prisma.comparisonMatch.deleteMany();
		await prisma.comparison.deleteMany();
		await prisma.uploadedProduct.deleteMany();
		await prisma.product.deleteMany();
		await prisma.notification.deleteMany();
		await prisma.uploadHistory.deleteMany();
		await prisma.user.deleteMany({ where: { role: { not: "ADMIN" } } });
		const companies = await prisma.company.findMany({
			select: { id: true, _count: { select: { users: true } } },
		});
		const empty = companies.filter((c) => c._count.users === 0).map((c) => c.id);
		if (empty.length) {
			await prisma.company.deleteMany({ where: { id: { in: empty } } });
		}
		console.log(`RESET_OK empresas removidas: ${empty.length}`);
	} catch (e) {
		console.log(`RESET_ERR ${String(e.message).split("\n")[0]}`);
	} finally {
		process.exit(0);
	}
})();
