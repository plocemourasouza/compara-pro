import { redirect } from "next/navigation";
import { UsersManager } from "@/components/shared/users-manager";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function SupplierUsersPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/auth/login");
	if (user.area !== "ADMIN" && user.area !== "REPRESENTATIVE") {
		redirect("/client");
	}

	return (
		<UsersManager
			scopeRole="REPRESENTATIVE"
			basePath="/supplier/usuarios"
			title="Usuários"
			subtitle={
				user.area === "ADMIN"
					? "Gerencie os representantes do sistema"
					: "Gerencie a equipe da sua empresa"
			}
		/>
	);
}
