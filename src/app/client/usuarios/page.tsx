import { redirect } from "next/navigation";
import { UsersManager } from "@/components/shared/users-manager";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function ClientUsersPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/auth/login");
	if (user.area !== "ADMIN" && user.area !== "CLIENT") {
		redirect(user.area === "REPRESENTATIVE" ? "/supplier" : "/admin");
	}

	return (
		<UsersManager
			scopeRole="CLIENT"
			basePath="/client/usuarios"
			title="Usuários"
			subtitle={
				user.area === "ADMIN"
					? "Gerencie os clientes do sistema"
					: "Gerencie a equipe da sua empresa"
			}
		/>
	);
}
