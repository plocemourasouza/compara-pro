/**
 * Demo seed: 2 suppliers with active product lists + 1 buyer with a requirements
 * list (3 matchable + 1 unmatched). Lets you exercise the full flow:
 * comparison -> AI parecer -> per-product override -> grouped pre-order.
 *
 * Run:  node scripts/seed-demo.cjs
 * Login (all): senha "demo1234"
 *   comprador@demo.com (CLIENT) | representante@demo.com (REPRESENTATIVE — representa Alfa e Beta)
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../src/generated/prisma");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function makeUploadWithProducts(companyId, uploadType, products) {
	const upload = await prisma.uploadHistory.create({
		data: {
			companyId,
			fileName:
				uploadType === "SUPPLIER_PRODUCTS"
					? "catalogo.xlsx"
					: "necessidades.xlsx",
			fileSize: 2048,
			totalRows: products.length,
			processedRows: products.length,
			errorRows: 0,
			uploadType,
			status: "COMPLETED",
			isActive: uploadType === "SUPPLIER_PRODUCTS",
			priceChangeIndicator: "FIRST_UPLOAD",
			processedAt: new Date(),
		},
	});
	await prisma.uploadedProduct.createMany({
		data: products.map((p, i) => ({
			uploadId: upload.id,
			originalRow: i + 2,
			sku: p.sku ?? null,
			code: p.code ?? null,
			name: p.name,
			price: p.price ?? null,
			targetPrice: p.targetPrice ?? null,
			quantity: p.quantity ?? null,
			unit: "UN",
		})),
	});
	return upload;
}

async function makeCatalog(companyId, items) {
	const upload = await prisma.uploadHistory.create({
		data: {
			companyId,
			fileName: "catalogo.xlsx",
			fileSize: 2048,
			totalRows: items.length,
			processedRows: items.length,
			errorRows: 0,
			uploadType: "SUPPLIER_PRODUCTS",
			status: "COMPLETED",
			isActive: true,
			priceChangeIndicator: "FIRST_UPLOAD",
			processedAt: new Date(),
		},
	});
	await prisma.product.createMany({
		data: items.map((p) => ({
			companyId,
			name: p.name,
			sku: p.sku ?? null,
			code: p.code ?? null,
			price: p.price ?? null,
			quantity: p.quantity ?? null,
			unit: "UN",
			isActive: true,
			lastUploadId: upload.id,
		})),
	});
	await prisma.uploadedProduct.createMany({
		data: items.map((p, i) => ({
			uploadId: upload.id,
			originalRow: i + 2,
			sku: p.sku ?? null,
			code: p.code ?? null,
			name: p.name,
			price: p.price ?? null,
			quantity: p.quantity ?? null,
			unit: "UN",
		})),
	});
	return upload;
}

// Empresa fornecedora — sem usuário de login. Quem opera é o representante.
async function makeSupplierCompany({ name, cnpj, email }) {
	return prisma.company.create({
		data: { name, type: "SUPPLIER", cnpj, email },
	});
}

async function makeCompanyWithUser({ name, type, cnpj, email }) {
	const company = await prisma.company.create({
		data: { name, type, cnpj, email },
	});
	await prisma.user.create({
		data: {
			email,
			name: `Usuário ${name}`,
			password: await bcrypt.hash("demo1234", 12),
			role: type === "SUPPLIER" ? "REPRESENTATIVE" : "CLIENT",
			companyId: company.id,
		},
	});
	return company;
}

// Registro de histórico "modelo" (sem produtos) — só para representar a tabela.
async function makeHistory(companyId, opts) {
	const total = opts.totalRows ?? 0;
	const errors = opts.errorRows ?? 0;
	const processed =
		opts.processedRows ?? (opts.status === "COMPLETED" ? total - errors : 0);
	return prisma.uploadHistory.create({
		data: {
			companyId,
			fileName: opts.fileName,
			fileSize: opts.fileSize ?? 4096,
			totalRows: total,
			processedRows: processed,
			errorRows: errors,
			uploadType: opts.uploadType,
			status: opts.status,
			isActive: false,
			priceChangeIndicator: opts.priceChangeIndicator ?? null,
			uploadedAt: opts.uploadedAt ?? new Date(),
			processedAt:
				opts.status === "PROCESSING" ? null : (opts.processedAt ?? new Date()),
		},
	});
}

const daysAgo = (n) => new Date(Date.now() - n * 86_400_000);

(async () => {
	try {
		// Admin de demonstração (idempotente, fora do skip) — usado pelos testes E2E.
		await prisma.user.upsert({
			where: { email: "admin@demo.com" },
			update: {},
			create: {
				email: "admin@demo.com",
				name: "Admin Demo",
				password: await bcrypt.hash("demo1234", 12),
				role: "ADMIN",
			},
		});

		const existing = await prisma.user.findUnique({
			where: { email: "comprador@demo.com" },
		});
		if (existing) {
			console.log(
				"SEED_SKIP demo já existe (comprador@demo.com). Nada a fazer.",
			);
			process.exit(0);
		}

		// Fornecedores são empresas (sem login próprio).
		const alfa = await makeSupplierCompany({
			name: "Fornecedor Alfa",
			cnpj: "11111111000111",
			email: "contato.alfa@demo.com",
		});
		await makeCatalog(alfa.id, [
			{ sku: "PAR-M6", name: "Parafuso M6", price: 0.5 },
			{ sku: "CAN-AZ", name: "Caneta Azul", price: 1.5 },
			{ code: "PAP-A4", name: "Papel A4 75g", price: 20.0 },
		]);

		const beta = await makeSupplierCompany({
			name: "Fornecedor Beta",
			cnpj: "22222222000122",
			email: "contato.beta@demo.com",
		});
		await makeCatalog(beta.id, [
			{ sku: "PAR-M6", name: "Parafuso M6 Inox", price: 0.45 },
			{ sku: "CAN-AZ", name: "Caneta Azul BIC", price: 1.2 },
			{ code: "PAP-A4", name: "Papel A4 Sulfite", price: 18.5 },
		]);

		// Representante comercial que representa Alfa E Beta (login do painel).
		const rep = await prisma.user.create({
			data: {
				email: "representante@demo.com",
				name: "Representante Demo",
				password: await bcrypt.hash("demo1234", 12),
				role: "REPRESENTATIVE",
				companyId: alfa.id, // fornecedor primário
			},
		});
		await prisma.representativeSupplier.createMany({
			data: [
				{ representativeId: rep.id, supplierCompanyId: alfa.id },
				{ representativeId: rep.id, supplierCompanyId: beta.id },
			],
			skipDuplicates: true,
		});

		const buyer = await makeCompanyWithUser({
			name: "Comprador Demo",
			type: "CLIENT",
			cnpj: "33333333000133",
			email: "comprador@demo.com",
		});
		// targetPrice = preço que o cliente pagava antes (base p/ "valor economizado").
		const clientUpload = await makeUploadWithProducts(
			buyer.id,
			"CLIENT_REQUIREMENTS",
			[
				{
					sku: "PAR-M6",
					name: "Parafuso M6",
					quantity: 500,
					targetPrice: 0.65,
				},
				{ sku: "CAN-AZ", name: "Caneta Azul", quantity: 100, targetPrice: 1.9 },
				{ code: "PAP-A4", name: "Papel A4", quantity: 50, targetPrice: 24.0 },
				{ sku: "XYZ-99", name: "Item Inexistente", quantity: 10 },
			],
		);

		// Carteira: comprador vinculado a Alfa E Beta — o representante (que
		// representa ambos) vê a carteira agregada e o matching cobre os dois.
		await prisma.supplierClient.createMany({
			data: [
				{ supplierCompanyId: alfa.id, clientCompanyId: buyer.id },
				{ supplierCompanyId: beta.id, clientCompanyId: buyer.id },
			],
		});
		// Solicitação pendente (demo da seção "Solicitações pendentes"): outro
		// cliente pede para entrar na carteira da Beta.
		const lojaDemo = await prisma.company.create({
			data: {
				name: "Loja Demo",
				type: "CLIENT",
				cnpj: "44444444000144",
				city: "Curitiba",
				state: "PR",
			},
		});
		await prisma.supplierLinkRequest.create({
			data: { supplierCompanyId: beta.id, clientCompanyId: lojaDemo.id },
		});

		const alfaProducts = await prisma.product.findMany({
			where: { companyId: alfa.id },
			take: 2,
		});
		// baseline = preço-alvo do cliente (snapshot) p/ economia nos finalizados.
		const BASELINE = { "Parafuso M6": 0.65, "Caneta Azul": 1.9 };
		const buildItems = () =>
			alfaProducts.map((p, i) => {
				const quantity = i === 0 ? 500 : 100;
				const price = p.price ?? 0;
				return {
					productId: p.id,
					quantity,
					price,
					totalPrice: price * quantity,
					baselinePrice: BASELINE[p.name] ?? null,
				};
			});
		// Pré-pedido em aberto (ACTIVE) — demonstra "Pré-pedidos em aberto".
		const openItems = buildItems();
		await prisma.preOrder.create({
			data: {
				clientId: buyer.id,
				supplierId: alfa.id,
				status: "ACTIVE",
				totalAmount: openItems.reduce((s, it) => s + it.totalPrice, 0),
				notes: "Pré-pedido de demonstração (em aberto).",
				items: { create: openItems },
			},
		});
		// Pré-pedido finalizado — demonstra "finalizados" + "valor economizado".
		const finalizedItems = buildItems();
		await prisma.preOrder.create({
			data: {
				clientId: buyer.id,
				supplierId: alfa.id,
				status: "FINALIZED",
				totalAmount: finalizedItems.reduce((s, it) => s + it.totalPrice, 0),
				notes: "Pré-pedido de demonstração (finalizado).",
				respondedAt: new Date(),
				items: { create: finalizedItems },
			},
		});

		// Comparação demo — popula funil ("comparações") e card de qualidade do matching.
		const clientReqs = await prisma.uploadedProduct.findMany({
			where: { uploadId: clientUpload.id },
		});
		const supplierProducts = await prisma.product.findMany({
			where: { companyId: { in: [alfa.id, beta.id] } },
		});
		const keyOf = (p) => (p.sku || p.code || "").toUpperCase();
		const matchSpecs = [
			{ key: "PAR-M6", qty: 500, matchType: "SKU" },
			{ key: "CAN-AZ", qty: 100, matchType: "SKU" },
			{ key: "PAP-A4", qty: 50, matchType: "CODE" },
		];
		const comparison = await prisma.comparison.create({
			data: {
				clientUploadId: clientUpload.id,
				clientId: buyer.id,
				totalProducts: clientReqs.length,
				matchedProducts: matchSpecs.length,
				unmatchedProducts: clientReqs.length - matchSpecs.length,
				priceChangeIndicator: "FIRST_UPLOAD",
			},
		});
		let bestPriceTotal = 0;
		let previousTotal = 0;
		for (const spec of matchSpecs) {
			const clientProduct = clientReqs.find((c) => keyOf(c) === spec.key);
			const offers = supplierProducts.filter((p) => keyOf(p) === spec.key);
			if (!clientProduct || offers.length === 0) continue;
			const best = offers.reduce((a, b) =>
				(b.price ?? Infinity) < (a.price ?? Infinity) ? b : a,
			);
			bestPriceTotal += (best.price ?? 0) * spec.qty;
			previousTotal +=
				(clientProduct.targetPrice ?? best.price ?? 0) * spec.qty;
			const match = await prisma.comparisonMatch.create({
				data: {
					comparisonId: comparison.id,
					clientProductId: clientProduct.id,
					productName: clientProduct.name,
					bestPrice: best.price ?? null,
					bestSupplierId: best.companyId,
					matchType: spec.matchType,
					confidence: 1.0,
				},
			});
			await prisma.supplierMatch.createMany({
				data: offers.map((o) => ({
					comparisonMatchId: match.id,
					supplierProductId: o.id,
					supplierCompanyId: o.companyId,
					price: o.price ?? 0,
					availableQuantity: o.quantity ?? 0,
					isActive: true,
				})),
			});
		}
		await prisma.comparison.update({
			where: { id: comparison.id },
			data: { bestPriceTotal, previousTotal },
		});

		// Histórico de demonstração: vários status/tipos/indicadores p/ a tabela.
		const histories = [
			{
				companyId: alfa.id,
				fileName: "catalogo-2026-01.xlsx",
				fileSize: 51200,
				uploadType: "SUPPLIER_PRODUCTS",
				status: "COMPLETED",
				totalRows: 320,
				errorRows: 0,
				priceChangeIndicator: "UP",
				uploadedAt: daysAgo(30),
				processedAt: daysAgo(30),
			},
			{
				companyId: alfa.id,
				fileName: "catalogo-2026-02.xlsx",
				fileSize: 49800,
				uploadType: "SUPPLIER_PRODUCTS",
				status: "COMPLETED",
				totalRows: 318,
				errorRows: 4,
				priceChangeIndicator: "DOWN",
				uploadedAt: daysAgo(15),
				processedAt: daysAgo(15),
			},
			{
				companyId: alfa.id,
				fileName: "catalogo-parcial.csv",
				fileSize: 18200,
				uploadType: "SUPPLIER_PRODUCTS",
				status: "FAILED",
				totalRows: 120,
				errorRows: 120,
				uploadedAt: daysAgo(7),
			},
			{
				companyId: alfa.id,
				fileName: "catalogo-2026-03.xlsx",
				fileSize: 52600,
				uploadType: "SUPPLIER_PRODUCTS",
				status: "PROCESSING",
				totalRows: 0,
				uploadedAt: daysAgo(0),
			},
			{
				companyId: beta.id,
				fileName: "tabela-precos-q1.xlsx",
				fileSize: 33400,
				uploadType: "SUPPLIER_PRODUCTS",
				status: "COMPLETED",
				totalRows: 210,
				errorRows: 0,
				priceChangeIndicator: "SAME",
				uploadedAt: daysAgo(20),
				processedAt: daysAgo(20),
			},
			{
				companyId: beta.id,
				fileName: "tabela-precos-rascunho.csv",
				fileSize: 9100,
				uploadType: "SUPPLIER_PRODUCTS",
				status: "CANCELLED",
				totalRows: 60,
				processedRows: 12,
				errorRows: 0,
				uploadedAt: daysAgo(10),
				processedAt: daysAgo(10),
			},
			{
				companyId: buyer.id,
				fileName: "necessidades-jan.xlsx",
				fileSize: 12800,
				uploadType: "CLIENT_REQUIREMENTS",
				status: "COMPLETED",
				totalRows: 80,
				errorRows: 0,
				uploadedAt: daysAgo(25),
				processedAt: daysAgo(25),
			},
			{
				companyId: buyer.id,
				fileName: "necessidades-fev.xlsx",
				fileSize: 11200,
				uploadType: "CLIENT_REQUIREMENTS",
				status: "FAILED",
				totalRows: 45,
				errorRows: 9,
				uploadedAt: daysAgo(5),
			},
		];
		for (const h of histories) {
			await makeHistory(h.companyId, h);
		}

		console.log(
			`SEED_OK fornecedores=2 representante=1 comprador=1 carteira=2 solicitacao=1 pre-pedidos=2 comparacao=1 historico=${histories.length} (senha demo1234)`,
		);
	} catch (e) {
		console.log(`SEED_ERR ${String(e.message).split("\n")[0]}`);
	} finally {
		process.exit(0);
	}
})();
