import { redirect } from "next/navigation";
import { UserForm } from "@/components/shared/user-form";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function NewClientUserPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/auth/login");
	if (user.area !== "ADMIN" && user.area !== "CLIENT") {
		redirect(user.area === "REPRESENTATIVE" ? "/supplier" : "/admin");
	}

	return (
		<UserForm
			mode="create"
			scopeRole="CLIENT"
			actorIsAdmin={user.area === "ADMIN"}
			returnTo="/client/usuarios"
		/>
	);
}
