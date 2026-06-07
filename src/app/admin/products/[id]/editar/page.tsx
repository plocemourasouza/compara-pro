import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/shared/product-form";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { ProductFormValues } from "@/lib/validations/product";

export default async function EditProductPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	const [product, companies] = await Promise.all([
		prisma.product.findFirst({
			where: { id, deletedAt: null },
			select: {
				code: true,
				sku: true,
				name: true,
				price: true,
				description: true,
				category: true,
				unit: true,
				companyId: true,
			},
		}),
		prisma.company.findMany({
			where: { deletedAt: null },
			select: { id: true, name: true, type: true },
			orderBy: { name: "asc" },
		}),
	]);

	if (!product) {
		notFound();
	}

	const defaultValues: Partial<ProductFormValues> = {
		code: product.code ?? "",
		sku: product.sku ?? "",
		name: product.name,
		price: product.price != null ? String(product.price) : "",
		description: product.description ?? "",
		category: product.category ?? "",
		unit: product.unit ?? "",
		companyId: product.companyId,
	};

	return (
		<ProductForm
			mode="edit"
			productId={id}
			showCompanySelect
			companies={companies}
			listHref="/admin/products"
			defaultValues={defaultValues}
		/>
	);
}
