import { notFound, redirect } from "next/navigation";
import { SupplierForm } from "@/components/shared/supplier-form";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export default async function EditSupplierPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	const ids = await getRepresentedSupplierIds(user);
	if (!ids.includes(id)) {
		notFound();
	}

	const supplier = await prisma.company.findFirst({
		where: { id, deletedAt: null },
		select: { name: true, cnpj: true, city: true, state: true },
	});
	if (!supplier) {
		notFound();
	}

	return (
		<SupplierForm
			mode="edit"
			supplierId={id}
			listHref="/supplier/fornecedores"
			defaultValues={{
				name: supplier.name,
				cnpj: supplier.cnpj ?? "",
				city: supplier.city ?? "",
				state: supplier.state ?? "",
			}}
		/>
	);
}
