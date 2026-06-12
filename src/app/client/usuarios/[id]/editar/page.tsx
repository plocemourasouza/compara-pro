import { notFound, redirect } from "next/navigation";
import { UserForm } from "@/components/shared/user-form";
import { areaOf } from "@/lib/area";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { UserFormValues } from "@/lib/validations/user";

export const dynamic = "force-dynamic";

export default async function EditClientUserPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getCurrentUser();
	if (!user) redirect("/auth/login");
	if (user.area !== "ADMIN" && user.area !== "CLIENT") {
		redirect(user.area === "REPRESENTATIVE" ? "/supplier" : "/admin");
	}

	const target = await prisma.user.findUnique({
		where: { id },
		select: {
			name: true,
			email: true,
			phone: true,
			companyId: true,
			company: { select: { type: true } },
		},
	});

	// Só clientes; autoatendimento limitado à própria empresa.
	if (!target) notFound();
	if (areaOf(target) !== "CLIENT") notFound();
	if (user.area !== "ADMIN" && target.companyId !== user.company?.id) {
		notFound();
	}

	const defaultValues: Partial<UserFormValues> = {
		name: target.name,
		email: target.email,
		phone: target.phone ?? "",
		role: "CLIENT",
	};

	return (
		<UserForm
			mode="edit"
			userId={id}
			defaultValues={defaultValues}
			scopeRole="CLIENT"
			actorIsAdmin={user.area === "ADMIN"}
			returnTo="/client/usuarios"
		/>
	);
}
