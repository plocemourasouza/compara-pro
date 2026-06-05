import { redirect } from "next/navigation";
import { ProductForm } from "@/components/shared/product-form";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export default async function NewProductPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	const companies = await prisma.company.findMany({
		where: { deletedAt: null },
		select: { id: true, name: true, type: true },
		orderBy: { name: "asc" },
	});

	return (
		<ProductForm
			mode="create"
			isAdmin
			companies={companies}
			listHref="/admin/products"
		/>
	);
}
