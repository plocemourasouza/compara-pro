const { PrismaClient } = require("../src/generated/prisma");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdmin() {
	try {
		// Verificar se já existe um admin
		const existingAdmin = await prisma.user.findFirst({
			where: { role: "ADMIN" },
		});

		if (existingAdmin) {
			console.log("✅ Usuário admin já existe:");
			console.log(`📧 Email: ${existingAdmin.email}`);
			return;
		}

		// Criar empresa admin
		const adminCompany = await prisma.company.create({
			data: {
				name: "PriceCompare Admin",
				type: "CLIENT",
			},
		});

		// Hash da senha
		const hashedPassword = await bcrypt.hash("admin123", 12);

		// Criar usuário admin
		const admin = await prisma.user.create({
			data: {
				name: "Administrador",
				email: "admin@pricecompare.com",
				password: hashedPassword,
				role: "ADMIN",
				companyId: adminCompany.id,
			},
			include: {
				company: true,
			},
		});

		console.log("🎉 Usuário administrador criado com sucesso!");
		console.log("📧 Email: admin@pricecompare.com");
		console.log("🔑 Senha: admin123");
		console.log("🏢 Empresa:", admin.company.name);
	} catch (error) {
		console.error("❌ Erro ao criar admin:", error);
	} finally {
		await prisma.$disconnect();
	}
}

createAdmin();
