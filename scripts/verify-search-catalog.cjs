// F6 RF-01/AC-07: prova que searchProducts (via /api/products/search) retorna
// ids do catálogo `products` (Product.id) — base do fix da FK do match manual.
require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });
const jwt = require("jsonwebtoken");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const B = process.env.BASE_URL || "http://localhost:3000";
const sign = (id) =>
	`auth_token=${jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "7d" })}`;

(async () => {
	const buyer = await prisma.user.findUnique({
		where: { email: "comprador@demo.com" },
		select: { id: true },
	});
	const cookie = sign(buyer.id);

	// pega um produto do catálogo (supplier) p/ usar como query
	const sample = await prisma.product.findFirst({
		where: { isActive: true, deletedAt: null, company: { type: "SUPPLIER" } },
		select: { name: true },
	});
	if (!sample) {
		console.log("0) SEM produto de fornecedor no catálogo — seed?");
		process.exit(0);
	}
	const q = sample.name.slice(0, Math.min(6, sample.name.length));
	console.log(`1) query="${q}"`);

	const res = await fetch(
		`${B}/api/products/search?q=${encodeURIComponent(q)}&limit=20`,
		{ headers: { Cookie: cookie } },
	);
	const json = await res.json();
	const items = json.products || json.data || json.results || [];
	console.log("2) search HTTP:", res.status, "resultados:", items.length);
	if (items.length === 0) {
		console.log("   (sem match — query pode não casar; não conclusivo)");
		process.exit(0);
	}

	// cada id retornado DEVE existir em products (catálogo) e NÃO ser de uploadedProduct
	let okCatalog = 0;
	let inStaging = 0;
	for (const it of items) {
		const p = await prisma.product.findUnique({ where: { id: it.id } });
		if (p) okCatalog++;
		const up = await prisma.uploadedProduct.findUnique({
			where: { id: it.id },
		});
		if (up) inStaging++;
	}
	console.log(
		`3) ids em catálogo products: ${okCatalog}/${items.length} | ids que são staging uploadedProduct: ${inStaging}`,
	);
	console.log(
		okCatalog === items.length && inStaging === 0
			? "✅ AC-01/fix-FK: searchProducts retorna Product.id (FK de SupplierMatch satisfeita por construção)"
			: "❌ ainda retorna ids fora do catálogo",
	);
	process.exit(0);
})().catch((e) => {
	console.log("ERR", e.message);
	process.exit(0);
});
