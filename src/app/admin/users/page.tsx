import { redirect } from "next/navigation";
import { UsersManager } from "@/components/shared/users-manager";
import { getCurrentUser } from "@/lib/auth-server";

export default async function UsersPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	// /admin/users gerencia apenas ADMINs. Representantes e clientes são geridos
	// nas próprias sessões (/supplier/usuarios e /client/usuarios).
	return (
		<UsersManager
			scopeRole="ADMIN"
			basePath="/admin/users"
			title="Administradores"
			subtitle="Gerencie os administradores do sistema"
		/>
	);
}
