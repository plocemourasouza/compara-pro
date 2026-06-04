require("dotenv").config({ path: ".env.local", quiet: true });
require("dotenv").config({ quiet: true });
const jwt = require("jsonwebtoken");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const B = "http://localhost:3000";

(async () => {
	const u = await prisma.user.findUnique({
		where: { email: "comprador@demo.com" },
		select: { id: true, companyId: true },
	});
	const up = await prisma.uploadHistory.findFirst({
		where: { companyId: u.companyId, uploadType: "CLIENT_REQUIREMENTS" },
		select: { id: true },
	});
	const cookie = "auth_token=" + jwt.sign({ userId: u.id }, process.env.JWT_SECRET, { expiresIn: "7d" });

	const cr = await fetch(B + "/api/comparison/create", {
		method: "POST",
		headers: { "Content-Type": "application/json", Cookie: cookie },
		body: JSON.stringify({ uploadId: up.id }),
	});
	const cj = await cr.json();
	console.log("CREATE", cr.status, JSON.stringify(cj).slice(0, 160));
	const cid = cj.comparisonId;
	if (!cid) return process.exit(0);

	const pr = await fetch(B + "/api/comparison/" + cid + "/parecer", { headers: { Cookie: cookie } });
	const pj = await pr.json();
	const p = pj.parecer || {};
	console.log("PARECER_STATUS", pr.status);
	console.log("geradoPorIA:", p.geradoPorIA);
	console.log("resumo:", (p.resumo || "").slice(0, 500));
	console.log("totais:", JSON.stringify(p.totais));
	console.log("oportunidades:", JSON.stringify(p.oportunidades));
	console.log("vantagens:", JSON.stringify(p.vantagens));
	process.exit(0);
})().catch((e) => {
	console.log("ERR", e.message);
	process.exit(0);
});
