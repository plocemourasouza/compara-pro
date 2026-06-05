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
	"auth_token=" +
	jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: "7d" });

(async () => {
	const admin = await prisma.user.findFirst({
		where: { role: "ADMIN" },
		select: { id: true },
	});
	const buyer = await prisma.user.findUnique({
		where: { email: "comprador@demo.com" },
		select: { id: true, companyId: true },
	});
	const adminCookie = sign(admin.id);
	const buyerCookie = sign(buyer.id);

	const cur = await (
		await fetch(B + "/api/admin/ai-config", {
			headers: { Cookie: adminCookie },
		})
	).json();
	console.log("config atual: provider=" + cur.provider + " model=" + cur.model);

	const MARK = "VERIFICACAO-PROMPT:";
	const customPrompt =
		"Você é um assistente de teste. Comece o campo resumo SEMPRE com o texto literal '" +
		MARK +
		"' e em seguida escreva o parecer normalmente.";

	const saveRes = await fetch(B + "/api/admin/ai-config", {
		method: "POST",
		headers: { "Content-Type": "application/json", Cookie: adminCookie },
		body: JSON.stringify({
			provider: cur.provider,
			model: cur.model,
			systemPrompt: customPrompt,
		}),
	});
	const saveJson = await saveRes.json();
	console.log(
		"1) salvar prompt (sem chave):",
		saveRes.status,
		"persistido=" + (saveJson.config?.systemPrompt === customPrompt),
	);

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
	const par = await (
		await fetch(B + "/api/comparison/" + cr.comparisonId + "/parecer", {
			headers: { Cookie: buyerCookie },
		})
	).json();
	const resumo = par.parecer?.resumo || "";
	console.log(
		"2) parecer usou o prompt custom:",
		resumo.startsWith(MARK),
		"| geradoPorIA=" + par.parecer?.geradoPorIA,
	);
	console.log("   resumo:", resumo.slice(0, 90));

	// reset to default (empty -> null)
	const reset = await fetch(B + "/api/admin/ai-config", {
		method: "POST",
		headers: { "Content-Type": "application/json", Cookie: adminCookie },
		body: JSON.stringify({
			provider: cur.provider,
			model: cur.model,
			systemPrompt: "",
		}),
	});
	const resetJson = await reset.json();
	console.log(
		"3) reset prompt -> null:",
		reset.status,
		"systemPrompt=" + resetJson.config?.systemPrompt,
	);
	process.exit(0);
})().catch((e) => {
	console.log("ERR", e.message);
	process.exit(0);
});
