import { redirect } from "next/navigation";
import { UserForm } from "@/components/shared/user-form";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function NewSupplierUserPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/auth/login");
	if (user.role !== "ADMIN" && user.role !== "REPRESENTATIVE") {
		redirect("/client");
	}

	return (
		<UserForm
			mode="create"
			scopeRole="REPRESENTATIVE"
			actorIsAdmin={user.role === "ADMIN"}
			returnTo="/supplier/usuarios"
		/>
	);
}
