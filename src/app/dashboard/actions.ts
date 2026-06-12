"use server";

import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function getDashboardStats() {
	try {
		const user = await requireAuth();

		if (user.area === "ADMIN") {
			// Estatísticas para admin
			const [userCount, companyCount, productCount, preOrderCount] =
				await Promise.all([
					prisma.user.count({ where: { deletedAt: null } }),
					prisma.company.count({ where: { deletedAt: null } }),
					prisma.product.count({ where: { deletedAt: null } }),
					prisma.preOrder.count(),
				]);

			return {
				users: userCount,
				companies: companyCount,
				products: productCount,
				preOrders: preOrderCount,
			};
		}

		if (user.area === "REPRESENTATIVE") {
			// Estatísticas agregadas dos fornecedores representados
			const supplierIds = await getRepresentedSupplierIds(user);
			const [productCount, activePreOrders, totalPreOrders] = await Promise.all(
				[
					prisma.product.count({
						where: {
							companyId: { in: supplierIds },
							deletedAt: null,
						},
					}),
					prisma.preOrder.count({
						where: {
							supplierId: { in: supplierIds },
							status: "ACTIVE",
						},
					}),
					prisma.preOrder.count({
						where: {
							supplierId: { in: supplierIds },
						},
					}),
				],
			);

			return {
				products: productCount,
				activePreOrders,
				totalPreOrders,
			};
		}

		if (user.area === "CLIENT") {
			// Estatísticas para cliente
			const [productCount, activePreOrders, totalPreOrders] = await Promise.all(
				[
					prisma.product.count({
						where: {
							companyId: user.company?.id,
							deletedAt: null,
						},
					}),
					prisma.preOrder.count({
						where: {
							clientId: user.company?.id,
							status: "ACTIVE",
						},
					}),
					prisma.preOrder.count({
						where: {
							clientId: user.company?.id,
						},
					}),
				],
			);

			return {
				products: productCount,
				activePreOrders,
				totalPreOrders,
			};
		}

		return {};
	} catch (error) {
		console.error("Get dashboard stats error:", error);
		throw new Error("Erro ao carregar estatísticas do dashboard");
	}
}

export async function getRecentActivities() {
	try {
		const user = await requireAuth();

		if (user.area === "ADMIN") {
			// Atividades recentes para admin
			const recentUsers = await prisma.user.findMany({
				take: 5,
				orderBy: { createdAt: "desc" },
				include: { company: true },
				where: { deletedAt: null },
			});

			return {
				type: "admin",
				activities: recentUsers.map((u) => ({
					id: u.id,
					type: "user_created",
					description: `Usuário ${u.name} se cadastrou`,
					date: u.createdAt,
					details: {
						user: u.name,
						company: u.company?.name,
					},
				})),
			};
		}

		if (user.area === "REPRESENTATIVE") {
			// Atividades recentes dos fornecedores representados
			const supplierIds = await getRepresentedSupplierIds(user);
			const recentPreOrders = await prisma.preOrder.findMany({
				take: 5,
				where: { supplierId: { in: supplierIds } },
				orderBy: { createdAt: "desc" },
				include: {
					client: true,
					supplier: { select: { name: true } },
					items: true,
				},
			});

			return {
				type: "supplier",
				activities: recentPreOrders.map((po) => ({
					id: po.id,
					type: "pre_order_received",
					description: `Pré-pedido de ${po.client.name} para ${po.supplier.name}`,
					date: po.createdAt,
					details: {
						client: po.client.name,
						supplier: po.supplier.name,
						status: po.status,
						itemCount: po.items.length,
					},
				})),
			};
		}

		if (user.area === "CLIENT") {
			// Atividades recentes para cliente
			const recentPreOrders = await prisma.preOrder.findMany({
				take: 5,
				where: { clientId: user.company?.id },
				orderBy: { createdAt: "desc" },
				include: {
					supplier: true,
					items: true,
				},
			});

			return {
				type: "client",
				activities: recentPreOrders.map((po) => ({
					id: po.id,
					type: "pre_order_created",
					description: `Pré-pedido para ${po.supplier.name}`,
					date: po.createdAt,
					details: {
						supplier: po.supplier.name,
						status: po.status,
						itemCount: po.items.length,
					},
				})),
			};
		}

		return { type: "unknown", activities: [] };
	} catch (error) {
		console.error("Get recent activities error:", error);
		return { type: "error", activities: [] };
	}
}
