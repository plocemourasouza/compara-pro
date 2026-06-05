import { notFound, redirect } from "next/navigation";
import { CompanyForm } from "@/components/shared/company-form";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { CreateCompanyData } from "@/lib/validations/company";

export default async function EditCompanyPage({
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

	const company = await prisma.company.findFirst({
		where: { id, deletedAt: null },
		select: {
			name: true,
			legalName: true,
			cnpj: true,
			type: true,
			taxRegime: true,
			email: true,
			phone: true,
			responsibleName: true,
			responsibleEmail: true,
			responsiblePhone: true,
			addressType: true,
			street: true,
			number: true,
			neighborhood: true,
			city: true,
			state: true,
			zipCode: true,
			addressReference: true,
		},
	});

	if (!company) {
		notFound();
	}

	// Normalize Prisma nulls → "" so RHF/zod controlled inputs stay happy.
	const defaultValues: Partial<CreateCompanyData> = {
		name: company.name,
		legalName: company.legalName ?? "",
		cnpj: company.cnpj ?? "",
		type: company.type as CreateCompanyData["type"],
		taxRegime: company.taxRegime as CreateCompanyData["taxRegime"],
		email: company.email ?? "",
		phone: company.phone ?? "",
		responsibleName: company.responsibleName ?? "",
		responsibleEmail: company.responsibleEmail ?? "",
		responsiblePhone: company.responsiblePhone ?? "",
		addressType: company.addressType ?? "Rua",
		street: company.street ?? "",
		number: company.number ?? "",
		neighborhood: company.neighborhood ?? "",
		city: company.city ?? "",
		state: company.state as CreateCompanyData["state"],
		zipCode: company.zipCode ?? "",
		addressReference: company.addressReference ?? "",
	};

	return (
		<CompanyForm mode="edit" companyId={id} defaultValues={defaultValues} />
	);
}
