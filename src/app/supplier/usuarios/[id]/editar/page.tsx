import { notFound, redirect } from "next/navigation";
import { UserForm } from "@/components/shared/user-form";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { UserFormValues } from "@/lib/validations/user";
import RepresentativeSuppliers from "./representative-suppliers";

export const dynamic = "force-dynamic";

export default async function EditSupplierUserPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getCurrentUser();
	if (!user) redirect("/auth/login");
	if (user.role !== "ADMIN" && user.role !== "REPRESENTATIVE") {
		redirect("/client");
	}

	const target = await prisma.user.findUnique({
		where: { id },
		select: {
			name: true,
			email: true,
			phone: true,
			role: true,
			companyId: true,
		},
	});

	// Só representantes; autoatendimento limitado à própria empresa.
	if (!target) notFound();
	if (target.role !== "REPRESENTATIVE") notFound();
	if (user.role !== "ADMIN" && target.companyId !== user.company?.id) {
		notFound();
	}

	const defaultValues: Partial<UserFormValues> = {
		name: target.name,
		email: target.email,
		phone: target.phone ?? "",
		role: "REPRESENTATIVE",
	};

	const isAdmin = user.role === "ADMIN";

	return (
		<div className="space-y-6">
			<UserForm
				mode="edit"
				userId={id}
				defaultValues={defaultValues}
				scopeRole="REPRESENTATIVE"
				actorIsAdmin={isAdmin}
				returnTo="/supplier/usuarios"
			/>
			{/* Vínculo representante↔fornecedor é decisão de ADMIN. */}
			{isAdmin && <RepresentativeSuppliers userId={id} />}
		</div>
	);
}
