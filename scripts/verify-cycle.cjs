require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });
const jwt = require("jsonwebtoken");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const B = "http://localhost:3000";
const sign = (id) =>
	"auth_token=" + jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "7d" });

(async () => {
	const buyer = await prisma.user.findUnique({
		where: { email: "comprador@demo.com" },
		select: { id: true, companyId: true },
	});
	const sup = await prisma.user.findUnique({
		where: { email: "fornecedor.beta@demo.com" },
		select: { id: true, companyId: true },
	});
	const betaId = sup.companyId;
	const buyerCookie = sign(buyer.id);
	const supCookie = sign(sup.id);
	const up = await prisma.uploadHistory.findFirst({
		where: { companyId: buyer.companyId, uploadType: "CLIENT_REQUIREMENTS" },
		select: { id: true },
	});

	const cr = await (
		await fetch(B + "/api/comparison/create", {
			method: "POST",
			headers: { "Content-Type": "application/json", Cookie: buyerCookie },
			body: JSON.stringify({ uploadId: up.id }),
		})
	).json();
	const cid = cr.comparisonId;
	console.log("1) comparison:", cid ? "ok" : "FAIL");

	const cmp = await (
		await fetch(B + "/api/comparison/" + cid, { headers: { Cookie: buyerCookie } })
	).json();
	const selected = [];
	for (const m of cmp.matches || []) {
		const sm = (m.supplierMatches || []).find((s) => s.supplier.id === betaId);
		if (sm) selected.push(m.id);
	}
	console.log("2) matches p/ Beta:", selected.length);

	const batch = await fetch(B + "/api/pre-order/create-batch", {
		method: "POST",
		headers: { "Content-Type": "application/json", Cookie: buyerCookie },
		body: JSON.stringify({
			comparisonId: cid,
			groups: [{ supplierId: betaId, selectedMatches: selected }],
		}),
	});
	const bj = await batch.json();
	console.log("3) create-batch:", batch.status, JSON.stringify(bj).slice(0, 120));
	const poId = (bj.preOrderIds || [])[0];

	const list = await (
		await fetch(B + "/api/pre-order/list?limit=50", { headers: { Cookie: supCookie } })
	).json();
	const found = (list.preOrders || []).find((p) => p.id === poId);
	console.log(
		"4) fornecedor vê o pré-pedido:",
		!!found,
		found ? "status=" + found.status + " total=" + found.totalAmount : "",
	);

	const appr = await fetch(B + "/api/pre-order/bulk-action", {
		method: "POST",
		headers: { "Content-Type": "application/json", Cookie: supCookie },
		body: JSON.stringify({ preOrderIds: [poId], action: "APPROVE" }),
	});
	const aj = await appr.json();
	console.log("5) approve:", appr.status, JSON.stringify(aj).slice(0, 120));

	const po = await prisma.preOrder.findUnique({
		where: { id: poId },
		select: { status: true },
	});
	console.log("6) status final:", po.status);
	process.exit(0);
})().catch((e) => {
	console.log("ERR", e.message);
	process.exit(0);
});
