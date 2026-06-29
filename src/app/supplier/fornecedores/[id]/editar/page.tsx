import { notFound, redirect } from "next/navigation";
import { SupplierForm } from "@/components/shared/supplier-form";
import { scopedSupplierIds } from "@/lib/auth-scope";
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

	// ADMIN edita qualquer fornecedor; representante só os que representa.
	const ids = await scopedSupplierIds(user);
	if (!ids.includes(id)) {
		notFound();
	}

	const supplier = await prisma.company.findFirst({
		where: { id, deletedAt: null },
		select: {
			name: true,
			legalName: true,
			cnpj: true,
			zipCode: true,
			street: true,
			number: true,
			neighborhood: true,
			city: true,
			state: true,
			responsibleName: true,
			responsibleEmail: true,
			responsiblePhone: true,
		},
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
				legalName: supplier.legalName ?? "",
				cnpj: supplier.cnpj ?? "",
				zipCode: supplier.zipCode ?? "",
				street: supplier.street ?? "",
				number: supplier.number ?? "",
				neighborhood: supplier.neighborhood ?? "",
				city: supplier.city ?? "",
				state: supplier.state ?? "",
				responsibleName: supplier.responsibleName ?? "",
				responsibleEmail: supplier.responsibleEmail ?? "",
				responsiblePhone: supplier.responsiblePhone ?? "",
			}}
		/>
	);
}
