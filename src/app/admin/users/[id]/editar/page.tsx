import { notFound, redirect } from "next/navigation";
import { UserForm } from "@/components/shared/user-form";
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

	if (user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	const target = await prisma.user.findUnique({
		where: { id },
		select: { name: true, email: true, role: true },
	});

	if (!target) {
		notFound();
	}

	const defaultValues: Partial<UserFormValues> = {
		name: target.name,
		email: target.email,
		role: target.role as UserFormValues["role"],
		password: "",
	};

	return <UserForm mode="edit" userId={id} defaultValues={defaultValues} />;
}
