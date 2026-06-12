import { notFound, redirect } from "next/navigation";
import { UserForm } from "@/components/shared/user-form";
import { areaOf } from "@/lib/area";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { UserFormValues } from "@/lib/validations/user";

export default async function EditUserPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN") {
		redirect("/dashboard");
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

	// /admin/users gerencia apenas ADMINs (representantes/clientes têm sessão própria).
	if (!target || areaOf(target) !== "ADMIN") {
		notFound();
	}

	const defaultValues: Partial<UserFormValues> = {
		name: target.name,
		email: target.email,
		phone: target.phone ?? "",
		role: "ADMIN",
	};

	return (
		<UserForm
			mode="edit"
			userId={id}
			defaultValues={defaultValues}
			scopeRole="ADMIN"
			actorIsAdmin
			returnTo="/admin/users"
		/>
	);
}
