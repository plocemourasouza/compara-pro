import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import PerfilClient from "./perfil-client";

export default async function PerfilPage() {
	const user = await getCurrentUser();
	if (!user) redirect("/auth/login");

	return (
		<PerfilClient
			user={{
				id: user.id,
				name: user.name,
				email: user.email,
				phone: user.phone ?? "",
				avatarUrl: user.avatarUrl ?? null,
				role: user.role,
				company: user.company?.name ?? null,
			}}
		/>
	);
}
