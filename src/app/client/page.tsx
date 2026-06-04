import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import ClientDashboard from "./client-dashboard";

export default async function ClientDashboardPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN" && user.role !== "CLIENT") {
		redirect(user.role === "SUPPLIER" ? "/supplier" : "/admin");
	}

	return <ClientDashboard user={user} />;
}
