import { notFound, redirect } from "next/navigation";
import { scopedSupplierIds } from "@/lib/auth-scope";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import EditClientForm from "./edit-client-form";

export default async function EditClientPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await requireAuth();
	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	const { id } = await params;

	// Representante só edita clientes da própria carteira; admin qualquer cliente.
	if (user.area !== "ADMIN") {
		const ids = await scopedSupplierIds(user);
		const link = ids.length
			? await prisma.supplierClient.findFirst({
					where: { clientCompanyId: id, supplierCompanyId: { in: ids } },
					select: { id: true },
				})
			: null;
		if (!link) notFound();
	}

	const client = await prisma.company.findUnique({
		where: { id },
		select: {
			id: true,
			type: true,
			name: true,
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
	if (client?.type !== "CLIENT") notFound();

	// Contato/usuário de login do cliente (responsável) para prefill.
	const contact = await prisma.user.findFirst({
		where: { companyId: id },
		orderBy: { createdAt: "asc" },
		select: { name: true, email: true, phone: true },
	});

	return (
		<EditClientForm
			clientId={id}
			defaultValues={{
				name: client.name,
				cnpj: client.cnpj ?? "",
				zipCode: client.zipCode ?? "",
				street: client.street ?? "",
				number: client.number ?? "",
				neighborhood: client.neighborhood ?? "",
				city: client.city ?? "",
				state: client.state ?? "",
				responsibleName: contact?.name ?? client.responsibleName ?? "",
				responsibleEmail: contact?.email ?? client.responsibleEmail ?? "",
				responsiblePhone: contact?.phone ?? client.responsiblePhone ?? "",
			}}
		/>
	);
}
