import { redirect } from "next/navigation";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import ProductsClient from "./products-client";

export default async function ProductsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "REPRESENTATIVE") {
		redirect("/dashboard");
	}

	const suppliers =
		user.area === "ADMIN"
			? await prisma.company.findMany({
					where: { type: "SUPPLIER", deletedAt: null },
					select: { id: true, name: true },
					orderBy: { name: "asc" },
				})
			: await prisma.company.findMany({
					where: {
						id: { in: await getRepresentedSupplierIds(user) },
						deletedAt: null,
					},
					select: { id: true, name: true },
					orderBy: { name: "asc" },
				});

	return <ProductsClient user={user} suppliers={suppliers} />;
}
