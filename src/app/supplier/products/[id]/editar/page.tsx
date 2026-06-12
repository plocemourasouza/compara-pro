import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/shared/product-form";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { ProductFormValues } from "@/lib/validations/product";

export default async function EditSupplierProductPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "REPRESENTATIVE") {
		redirect("/dashboard");
	}

	const isAdmin = user.area === "ADMIN";
	const representedIds = isAdmin ? [] : await getRepresentedSupplierIds(user);

	const product = await prisma.product.findFirst({
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
	});

	if (!product) {
		notFound();
	}

	// Representante só edita produtos de fornecedores que representa.
	if (!isAdmin && !representedIds.includes(product.companyId)) {
		notFound();
	}

	const companies = isAdmin
		? await prisma.company.findMany({
				where: { deletedAt: null },
				select: { id: true, name: true, type: true },
				orderBy: { name: "asc" },
			})
		: await prisma.company.findMany({
				where: { id: { in: representedIds }, deletedAt: null },
				select: { id: true, name: true, type: true },
				orderBy: { name: "asc" },
			});

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
			showCompanySelect={true}
			companyLabel={isAdmin ? "Empresa *" : "Fornecedor *"}
			companies={companies}
			listHref="/supplier/products"
			defaultValues={defaultValues}
		/>
	);
}
