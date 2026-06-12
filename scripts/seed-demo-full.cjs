/**
 * Seed RICO (aditivo) — roda POR CIMA do seed-demo p/ popular o dashboard admin
 * por completo: vários fornecedores/representantes/clientes, comparações e
 * pré-pedidos distribuídos em 30 dias, matching com baixa confiança, uploads com
 * falhas, e solicitações de carteira (incl. atrasadas).
 *
 * Pré-requisito: rodar `npm run seed:demo` antes (cria admin/alfa/beta/comprador).
 * Uso:  node scripts/seed-demo-full.cjs   (idempotente: pula se já populado)
 */
require("dotenv").config();
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../src/generated/prisma");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const day = 86_400_000;
const daysAgo = (n) => new Date(Date.now() - n * day);
const round2 = (n) => Math.round(n * 100) / 100;

// Catálogo base compartilhado (sku/code + preço base). Fornecedores ofertam com
// fatores diferentes → competição de preço real no matching.
const SKUS = [
	{ key: "PAR-M6", name: "Parafuso M6", base: 0.5, byCode: false },
	{ key: "CAN-AZ", name: "Caneta Azul", base: 1.5, byCode: false },
	{ key: "PAP-A4", name: "Papel A4", base: 20, byCode: true },
	{ key: "CAB-RJ45", name: "Cabo RJ45", base: 8, byCode: false },
	{ key: "TON-HP", name: "Toner HP", base: 90, byCode: false },
	{ key: "LUV-NIT", name: "Luva Nitrílica", base: 25, byCode: false },
	{ key: "DET-5L", name: "Detergente 5L", base: 18, byCode: true },
	{ key: "COP-200", name: "Copo 200ml", base: 12, byCode: false },
];
const skuOf = (key) => SKUS.find((s) => s.key === key);

let cnpjSeq = 50000000;
const nextCnpj = () => `${String(cnpjSeq++).padStart(8, "0")}000100`;

async function makeSupplier({ name, factor, keys, uploadedAt }) {
	const company = await prisma.company.create({
		data: {
			name,
			type: "SUPPLIER",
			cnpj: nextCnpj(),
			email: `${name.replace(/\s+/g, "").toLowerCase()}@demo.com`,
		},
	});
	const upload = await prisma.uploadHistory.create({
		data: {
			companyId: company.id,
			fileName: "catalogo.xlsx",
			fileSize: 4096,
			totalRows: keys.length,
			processedRows: keys.length,
			errorRows: 0,
			uploadType: "SUPPLIER_PRODUCTS",
			status: "COMPLETED",
			isActive: true,
			priceChangeIndicator: "FIRST_UPLOAD",
			uploadedAt,
			processedAt: uploadedAt,
		},
	});
	const productByKey = {};
	for (const key of keys) {
		const s = skuOf(key);
		const price = round2(s.base * factor);
		const p = await prisma.product.create({
			data: {
				companyId: company.id,
				name: s.name,
				sku: s.byCode ? null : key,
				code: s.byCode ? key : null,
				price,
				quantity: 1000,
				unit: "UN",
				isActive: true,
				lastUploadId: upload.id,
			},
		});
		productByKey[key] = { id: p.id, price };
	}
	return { company, productByKey };
}

async function main() {
	// Guard idempotente.
	const already = await prisma.company.findFirst({
		where: { name: "Fornecedor Gama" },
	});
	if (already) {
		console.log("FULL_SKIP já populado (Fornecedor Gama existe).");
		return;
	}

	const alfa = await prisma.company.findFirst({
		where: { name: "Fornecedor Alfa" },
	});
	const beta = await prisma.company.findFirst({
		where: { name: "Fornecedor Beta" },
	});
	if (!alfa || !beta) {
		console.log("FULL_ERR rode `npm run seed:demo` antes.");
		process.exit(1);
	}

	// --- Fornecedores novos (+ Alfa/Beta existentes) ---
	const allKeys = SKUS.map((s) => s.key);
	const gama = await makeSupplier({
		name: "Fornecedor Gama",
		factor: 0.95,
		keys: allKeys,
		uploadedAt: daysAgo(26),
	});
	const delta = await makeSupplier({
		name: "Fornecedor Delta",
		factor: 1.08,
		keys: allKeys.slice(0, 6),
		uploadedAt: daysAgo(20),
	});
	const epsilon = await makeSupplier({
		name: "Fornecedor Epsilon",
		factor: 0.88,
		keys: allKeys.slice(2),
		uploadedAt: daysAgo(14),
	});
	const zeta = await makeSupplier({
		name: "Fornecedor Zeta",
		factor: 1.0,
		keys: allKeys.slice(0, 5),
		uploadedAt: daysAgo(7),
	});

	// Mapa de ofertas por key (fornecedor → {companyId, price, productId}).
	// Inclui Alfa/Beta (preços do seed-demo) p/ os 3 SKUs originais.
	const alfaProducts = await prisma.product.findMany({
		where: { companyId: alfa.id },
	});
	const betaProducts = await prisma.product.findMany({
		where: { companyId: beta.id },
	});
	const keyOfProd = (p) => (p.sku || p.code || "").toUpperCase();
	const offersByKey = {};
	const addOffer = (key, company, productId, price) => {
		if (!offersByKey[key]) offersByKey[key] = [];
		offersByKey[key].push({
			companyId: company.id,
			name: company.name,
			productId,
			price,
		});
	};
	for (const p of alfaProducts) addOffer(keyOfProd(p), alfa, p.id, p.price);
	for (const p of betaProducts) addOffer(keyOfProd(p), beta, p.id, p.price);
	for (const sup of [gama, delta, epsilon, zeta]) {
		for (const [key, info] of Object.entries(sup.productByKey)) {
			addOffer(key, sup.company, info.id, info.price);
		}
	}

	// --- Representantes novos ---
	const repPass = await bcrypt.hash("demo1234", 12);
	const repSpecs = [
		{
			email: "rep.gama@demo.com",
			name: "Rep Gama",
			primary: gama.company,
			also: [delta.company],
		},
		{
			email: "rep.epsilon@demo.com",
			name: "Rep Epsilon",
			primary: epsilon.company,
			also: [],
		},
		{
			email: "rep.zeta@demo.com",
			name: "Rep Zeta",
			primary: zeta.company,
			also: [gama.company],
		},
	];
	for (const r of repSpecs) {
		// Cada representante é uma agência (conta) que representa N fornecedores.
		const agency = await prisma.company.create({
			data: { name: `${r.name} (Agência)`, type: "REPRESENTATIVE" },
		});
		await prisma.user.create({
			data: {
				email: r.email,
				name: r.name,
				password: repPass,
				companyId: agency.id,
			},
		});
		const links = [r.primary, ...r.also].map((c) => ({
			representativeCompanyId: agency.id,
			supplierCompanyId: c.id,
		}));
		await prisma.representativeSupplier.createMany({
			data: links,
			skipDuplicates: true,
		});
	}

	// --- Clientes novos + comparação + matches ---
	const clientPass = await bcrypt.hash("demo1234", 12);
	const clientSpecs = [
		{
			name: "Mercado Central",
			keys: ["PAR-M6", "CAN-AZ", "PAP-A4", "CAB-RJ45"],
			targetFactor: 1.2,
			reqDay: 25,
		},
		{
			name: "Construtora Ipê",
			keys: ["PAR-M6", "LUV-NIT", "TON-HP", "DET-5L"],
			targetFactor: 1.15,
			reqDay: 22,
		},
		{
			name: "Hospital Vida",
			keys: ["LUV-NIT", "DET-5L", "COP-200", "PAP-A4"],
			targetFactor: 1.25,
			reqDay: 17,
		},
		{
			name: "Escola Saber",
			keys: ["CAN-AZ", "PAP-A4", "COP-200"],
			targetFactor: 1.18,
			reqDay: 11,
		},
		{
			name: "TechParts",
			keys: ["CAB-RJ45", "TON-HP", "COP-200", "PAR-M6"],
			targetFactor: 1.3,
			reqDay: 5,
		},
	];

	const clients = [];
	for (const spec of clientSpecs) {
		const company = await prisma.company.create({
			data: {
				name: spec.name,
				type: "CLIENT",
				cnpj: nextCnpj(),
				city: "São Paulo",
				state: "SP",
			},
		});
		await prisma.user.create({
			data: {
				email: `${spec.name.replace(/\s+/g, "").toLowerCase()}@demo.com`,
				name: `Comprador ${spec.name}`,
				password: clientPass,
				companyId: company.id,
			},
		});

		// Upload de requisitos (com targetPrice) + 1 item sem match.
		const reqUpload = await prisma.uploadHistory.create({
			data: {
				companyId: company.id,
				fileName: "necessidades.xlsx",
				fileSize: 2048,
				totalRows: spec.keys.length + 1,
				processedRows: spec.keys.length + 1,
				errorRows: 0,
				uploadType: "CLIENT_REQUIREMENTS",
				status: "COMPLETED",
				isActive: false,
				priceChangeIndicator: "FIRST_UPLOAD",
				uploadedAt: daysAgo(spec.reqDay),
				processedAt: daysAgo(spec.reqDay),
			},
		});
		const reqProducts = [];
		for (let i = 0; i < spec.keys.length; i++) {
			const s = skuOf(spec.keys[i]);
			const up = await prisma.uploadedProduct.create({
				data: {
					uploadId: reqUpload.id,
					originalRow: i + 2,
					sku: s.byCode ? null : s.key,
					code: s.byCode ? s.key : null,
					name: s.name,
					targetPrice: round2(s.base * spec.targetFactor),
					quantity: 50 + i * 25,
					unit: "UN",
				},
			});
			reqProducts.push({ ...up, key: s.key });
		}
		// item sem correspondência (engrossa unmatched).
		await prisma.uploadedProduct.create({
			data: {
				uploadId: reqUpload.id,
				originalRow: 99,
				sku: "SEM-MATCH",
				name: "Item sem fornecedor",
				quantity: 10,
				unit: "UN",
			},
		});

		// Comparação + matches.
		const comparison = await prisma.comparison.create({
			data: {
				clientUploadId: reqUpload.id,
				clientId: company.id,
				totalProducts: spec.keys.length + 1,
				matchedProducts: spec.keys.length,
				unmatchedProducts: 1,
				priceChangeIndicator: "FIRST_UPLOAD",
				createdAt: daysAgo(spec.reqDay),
			},
		});

		let bestPriceTotal = 0;
		let previousTotal = 0;
		const matchInfos = [];
		for (let i = 0; i < reqProducts.length; i++) {
			const rp = reqProducts[i];
			const offers = offersByKey[rp.key] || [];
			if (offers.length === 0) continue;
			const best = offers.reduce((a, b) => (b.price < a.price ? b : a));
			const qty = rp.quantity;
			bestPriceTotal += best.price * qty;
			previousTotal += (rp.targetPrice ?? best.price) * qty;

			// Variedade de matchType: 1º item NAME baixa-confiança, senão SKU/CODE.
			const s = skuOf(rp.key);
			const lowConf = i === 0;
			const matchType = lowConf ? "NAME" : s.byCode ? "CODE" : "SKU";
			const confidence = lowConf ? 0.45 : 1.0;

			const match = await prisma.comparisonMatch.create({
				data: {
					comparisonId: comparison.id,
					clientProductId: rp.id,
					productName: rp.name,
					bestPrice: best.price,
					bestSupplierId: best.companyId,
					matchType,
					confidence,
				},
			});
			await prisma.supplierMatch.createMany({
				data: offers.map((o) => ({
					comparisonMatchId: match.id,
					supplierProductId: o.productId,
					supplierCompanyId: o.companyId,
					price: o.price,
					availableQuantity: 1000,
					isActive: true,
				})),
			});
			matchInfos.push({
				matchId: match.id,
				key: rp.key,
				qty,
				targetPrice: rp.targetPrice,
				offers,
			});
		}
		await prisma.comparison.update({
			where: { id: comparison.id },
			data: {
				bestPriceTotal: round2(bestPriceTotal),
				previousTotal: round2(previousTotal),
			},
		});

		// Carteira: vincula a 2-3 fornecedores.
		const supplierIds = [
			...new Set(matchInfos.flatMap((m) => m.offers.map((o) => o.companyId))),
		].slice(0, 3);
		await prisma.supplierClient.createMany({
			data: supplierIds.map((sid) => ({
				supplierCompanyId: sid,
				clientCompanyId: company.id,
			})),
			skipDuplicates: true,
		});

		clients.push({ company, comparison, matchInfos });
	}

	// --- Pré-pedidos distribuídos (status + datas) ---
	// Distribuição: mistura ACTIVE/FINALIZED/REJECTED ao longo de 30 dias.
	const STATUS_CYCLE = [
		"FINALIZED",
		"FINALIZED",
		"ACTIVE",
		"FINALIZED",
		"REJECTED",
		"ACTIVE",
		"FINALIZED",
	];
	let poCount = 0;
	let statusIdx = 0;
	for (const cl of clients) {
		// agrupa ofertas por fornecedor que cobre ao menos 1 match do cliente.
		const supplierSet = [
			...new Set(
				cl.matchInfos.flatMap((m) => m.offers.map((o) => o.companyId)),
			),
		];
		// cria 1 pré-pedido por fornecedor (até 4) com datas escalonadas.
		const chosenSuppliers = supplierSet.slice(0, 4);
		for (let k = 0; k < chosenSuppliers.length; k++) {
			const supplierId = chosenSuppliers[k];
			const items = cl.matchInfos
				.map((m) => {
					const offer = m.offers.find((o) => o.companyId === supplierId);
					if (!offer) return null;
					return {
						matchId: m.matchId,
						productId: offer.productId,
						quantity: m.qty,
						price: offer.price,
						totalPrice: round2(offer.price * m.qty),
						baselinePrice: m.targetPrice ?? null,
					};
				})
				.filter(Boolean);
			if (items.length === 0) continue;

			const status = STATUS_CYCLE[statusIdx % STATUS_CYCLE.length];
			statusIdx++;
			const createdAt = daysAgo((poCount * 29) % 30);
			const responded = status === "FINALIZED" || status === "REJECTED";
			await prisma.preOrder.create({
				data: {
					comparisonId: cl.comparison.id,
					clientId: cl.company.id,
					supplierId,
					status,
					totalAmount: round2(items.reduce((s, it) => s + it.totalPrice, 0)),
					notes: `Pré-pedido ${status.toLowerCase()} (demo rico).`,
					createdAt,
					respondedAt: responded ? new Date(createdAt.getTime() + day) : null,
					items: { create: items },
				},
			});
			poCount++;
		}
	}

	// --- Uploads extra p/ tendência + saúde (incl. falhas/processing) ---
	const supplierCompanies = [
		alfa,
		beta,
		gama.company,
		delta.company,
		epsilon.company,
		zeta.company,
	];
	const histStatuses = [
		"COMPLETED",
		"COMPLETED",
		"FAILED",
		"COMPLETED",
		"PROCESSING",
		"COMPLETED",
		"FAILED",
	];
	const priceInds = ["UP", "DOWN", "SAME", "FIRST_UPLOAD"];
	let histCount = 0;
	for (let d = 0; d < 28; d += 1) {
		// ~1 upload a cada ~1.3 dias.
		if (d % 1 !== 0 && d % 3 === 0) continue;
		const company = supplierCompanies[histCount % supplierCompanies.length];
		const status = histStatuses[histCount % histStatuses.length];
		const total = 40 + (histCount % 5) * 10;
		const errors =
			status === "FAILED"
				? 5 + (histCount % 7)
				: status === "COMPLETED"
					? histCount % 3
					: 0;
		await prisma.uploadHistory.create({
			data: {
				companyId: company.id,
				fileName: `lista-${d}.xlsx`,
				fileSize: 4096,
				totalRows: total,
				processedRows: status === "PROCESSING" ? 0 : total - errors,
				errorRows: errors,
				uploadType:
					histCount % 4 === 0 ? "CLIENT_REQUIREMENTS" : "SUPPLIER_PRODUCTS",
				status,
				isActive: false,
				priceChangeIndicator: priceInds[histCount % priceInds.length],
				uploadedAt: daysAgo(d),
				processedAt: status === "PROCESSING" ? null : daysAgo(d),
			},
		});
		histCount++;
	}

	// --- Solicitações de carteira (incl. atrasadas > 7 dias) ---
	const lojaA = await prisma.company.create({
		data: {
			name: "Atacadão Sul",
			type: "CLIENT",
			cnpj: nextCnpj(),
			city: "Porto Alegre",
			state: "RS",
		},
	});
	const lojaB = await prisma.company.create({
		data: {
			name: "Distribuidora Norte",
			type: "CLIENT",
			cnpj: nextCnpj(),
			city: "Belém",
			state: "PA",
		},
	});
	await prisma.supplierLinkRequest.createMany({
		data: [
			{
				supplierCompanyId: gama.company.id,
				clientCompanyId: lojaA.id,
				status: "PENDING",
				createdAt: daysAgo(12),
			},
			{
				supplierCompanyId: delta.company.id,
				clientCompanyId: lojaB.id,
				status: "PENDING",
				createdAt: daysAgo(9),
			},
			{
				supplierCompanyId: epsilon.company.id,
				clientCompanyId: lojaA.id,
				status: "PENDING",
				createdAt: daysAgo(2),
			},
			{
				supplierCompanyId: zeta.company.id,
				clientCompanyId: lojaB.id,
				status: "APPROVED",
				createdAt: daysAgo(15),
				respondedAt: daysAgo(13),
			},
			{
				supplierCompanyId: gama.company.id,
				clientCompanyId: lojaB.id,
				status: "REJECTED",
				createdAt: daysAgo(18),
				respondedAt: daysAgo(17),
			},
		],
	});

	// Usuários inativos (soft-delete) p/ exibir "inativos" nos cards. Cada um numa
	// empresa do tipo correto (agência p/ rep, cliente p/ cliente) — coerente com
	// o modelo "área = company.type".
	const inativaAgency = await prisma.company.create({
		data: { name: "Agência Inativa", type: "REPRESENTATIVE" },
	});
	const inativaClient = await prisma.company.create({
		data: { name: "Cliente Inativo Ltda", type: "CLIENT" },
	});
	await prisma.user.createMany({
		data: [
			{
				email: "rep.inativo@demo.com",
				name: "Rep Inativo",
				password: repPass,
				companyId: inativaAgency.id,
				deletedAt: daysAgo(3),
			},
			{
				email: "cliente.inativo@demo.com",
				name: "Cliente Inativo",
				password: clientPass,
				companyId: inativaClient.id,
				deletedAt: daysAgo(5),
			},
		],
	});

	const [comparisons, preorders, uploads, users, companies] = await Promise.all(
		[
			prisma.comparison.count(),
			prisma.preOrder.count(),
			prisma.uploadHistory.count(),
			prisma.user.count(),
			prisma.company.count(),
		],
	);
	console.log(
		`FULL_OK comparacoes=${comparisons} pre-pedidos=${preorders} uploads=${uploads} usuarios=${users} empresas=${companies}`,
	);
}

main()
	.catch((e) => {
		console.log("FULL_ERR", String(e.message).split("\n")[0]);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
