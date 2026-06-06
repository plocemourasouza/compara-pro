/**
 * Demo seed: 2 suppliers with active product lists + 1 buyer with a requirements
 * list (3 matchable + 1 unmatched). Lets you exercise the full flow:
 * comparison -> AI parecer -> per-product override -> grouped pre-order.
 *
 * Run:  node scripts/seed-demo.cjs
 * Login (all): senha "demo1234"
 *   comprador@demo.com (CLIENT) | fornecedor.alfa@demo.com | fornecedor.beta@demo.com
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

async function makeCompanyWithUser({ name, type, cnpj, email }) {
	const company = await prisma.company.create({
		data: { name, type, cnpj, email },
	});
	await prisma.user.create({
		data: {
			email,
			name: `Usuário ${name}`,
			password: await bcrypt.hash("demo1234", 12),
			role: type === "SUPPLIER" ? "SUPPLIER" : "CLIENT",
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

		const alfa = await makeCompanyWithUser({
			name: "Fornecedor Alfa",
			type: "SUPPLIER",
			cnpj: "11111111000111",
			email: "fornecedor.alfa@demo.com",
		});
		await makeCatalog(alfa.id, [
			{ sku: "PAR-M6", name: "Parafuso M6", price: 0.5 },
			{ sku: "CAN-AZ", name: "Caneta Azul", price: 1.5 },
			{ code: "PAP-A4", name: "Papel A4 75g", price: 20.0 },
		]);

		const beta = await makeCompanyWithUser({
			name: "Fornecedor Beta",
			type: "SUPPLIER",
			cnpj: "22222222000122",
			email: "fornecedor.beta@demo.com",
		});
		await makeCatalog(beta.id, [
			{ sku: "PAR-M6", name: "Parafuso M6 Inox", price: 0.45 },
			{ sku: "CAN-AZ", name: "Caneta Azul BIC", price: 1.2 },
			{ code: "PAP-A4", name: "Papel A4 Sulfite", price: 18.5 },
		]);

		const buyer = await makeCompanyWithUser({
			name: "Comprador Demo",
			type: "CLIENT",
			cnpj: "33333333000133",
			email: "comprador@demo.com",
		});
		await makeUploadWithProducts(buyer.id, "CLIENT_REQUIREMENTS", [
			{ sku: "PAR-M6", name: "Parafuso M6", quantity: 500 },
			{ sku: "CAN-AZ", name: "Caneta Azul", quantity: 100 },
			{ code: "PAP-A4", name: "Papel A4", quantity: 50 },
			{ sku: "XYZ-99", name: "Item Inexistente", quantity: 10 },
		]);

		// Carteira: comprador vinculado à alfa; solicitação pendente p/ beta (demo).
		await prisma.supplierClient.create({
			data: { supplierCompanyId: alfa.id, clientCompanyId: buyer.id },
		});
		await prisma.supplierLinkRequest.create({
			data: { supplierCompanyId: beta.id, clientCompanyId: buyer.id },
		});

		const alfaProducts = await prisma.product.findMany({
			where: { companyId: alfa.id },
			take: 2,
		});
		const preOrderItems = alfaProducts.map((p, i) => {
			const quantity = i === 0 ? 500 : 100;
			const price = p.price ?? 0;
			return { productId: p.id, quantity, price, totalPrice: price * quantity };
		});
		await prisma.preOrder.create({
			data: {
				clientId: buyer.id,
				supplierId: alfa.id,
				status: "ACTIVE",
				totalAmount: preOrderItems.reduce((s, it) => s + it.totalPrice, 0),
				notes: "Pré-pedido de demonstração.",
				items: { create: preOrderItems },
			},
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
			`SEED_OK fornecedores=2 comprador=1 carteira=1 solicitacao=1 pre-pedido=1 historico=${histories.length} (senha demo1234)`,
		);
	} catch (e) {
		console.log(`SEED_ERR ${String(e.message).split("\n")[0]}`);
	} finally {
		process.exit(0);
	}
})();
