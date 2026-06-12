import { redirect } from "next/navigation";
import { UserForm } from "@/components/shared/user-form";
import { getCurrentUser } from "@/lib/auth-server";

export default async function NewUserPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	return (
		<UserForm
			mode="create"
			scopeRole="ADMIN"
			actorIsAdmin
			returnTo="/admin/users"
		/>
	);
}
