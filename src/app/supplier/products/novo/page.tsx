import { redirect } from "next/navigation";
import { ProductForm } from "@/components/shared/product-form";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { ProductFormValues } from "@/lib/validations/product";

export default async function NewSupplierProductPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN" && user.role !== "SUPPLIER") {
		redirect("/dashboard");
	}

	const isAdmin = user.role === "ADMIN";
	const companies = isAdmin
		? await prisma.company.findMany({
				where: { deletedAt: null },
				select: { id: true, name: true, type: true },
				orderBy: { name: "asc" },
			})
		: [];

	const defaultValues: Partial<ProductFormValues> = isAdmin
		? {}
		: { companyId: user.company?.id ?? "" };

	return (
		<ProductForm
			mode="create"
			isAdmin={isAdmin}
			companies={companies}
			listHref="/supplier/products"
			defaultValues={defaultValues}
		/>
	);
}
