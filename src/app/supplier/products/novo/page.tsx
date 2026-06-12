import { redirect } from "next/navigation";
import { ProductForm } from "@/components/shared/product-form";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { ProductFormValues } from "@/lib/validations/product";

export default async function NewSupplierProductPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "REPRESENTATIVE") {
		redirect("/dashboard");
	}

	const isAdmin = user.area === "ADMIN";
	const companies = isAdmin
		? await prisma.company.findMany({
				where: { deletedAt: null },
				select: { id: true, name: true, type: true },
				orderBy: { name: "asc" },
			})
		: await prisma.company.findMany({
				where: {
					id: { in: await getRepresentedSupplierIds(user) },
					deletedAt: null,
				},
				select: { id: true, name: true, type: true },
				orderBy: { name: "asc" },
			});

	const defaultValues: Partial<ProductFormValues> =
		!isAdmin && companies.length === 1
			? { companyId: companies[0]?.id ?? "" }
			: {};

	return (
		<ProductForm
			mode="create"
			showCompanySelect={true}
			companyLabel={isAdmin ? "Empresa *" : "Fornecedor *"}
			companies={companies}
			listHref="/supplier/products"
			defaultValues={defaultValues}
		/>
	);
}
