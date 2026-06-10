require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });
const jwt = require("jsonwebtoken");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");
const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const B = process.env.BASE_URL || "http://localhost:3000";
(async () => {
	const buyer = await prisma.user.findUnique({
		where: { email: "comprador@demo.com" },
		select: { id: true, companyId: true },
	});
	const cookie = `auth_token=${jwt.sign({ userId: buyer.id }, process.env.JWT_SECRET, { expiresIn: "7d" })}`;
	const cmp = await prisma.comparison.findFirst({
		where: { clientId: buyer.companyId },
		orderBy: { createdAt: "desc" },
		select: { id: true },
	});
	const r = await fetch(`${B}/api/comparison/${cmp.id}`, {
		headers: { Cookie: cookie },
	});
	const j = await r.json();
	const m = j.matches || [];
	const withKey = m.filter(
		(x) => x.clientProduct && Object.hasOwn(x.clientProduct, "targetPrice"),
	).length;
	const withVal = m.filter(
		(x) => x.clientProduct && x.clientProduct.targetPrice != null,
	).length;
	console.log(
		"HTTP",
		r.status,
		"| matches:",
		m.length,
		"| chave targetPrice:",
		withKey,
		"| valor não-null:",
		withVal,
	);
	console.log(
		m.length > 0 && withKey === m.length
			? "✅ RF-01: targetPrice exposto em todos os matches"
			: "❌ chave ausente",
	);
	process.exit(0);
})().catch((e) => {
	console.log("ERR", e.message);
	process.exit(0);
});
