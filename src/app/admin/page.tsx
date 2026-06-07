import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import AdminDashboard from "./admin-dashboard";

export default async function AdminDashboardPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect(user.role === "REPRESENTATIVE" ? "/supplier" : "/client");
	}

	return <AdminDashboard user={user} />;
}
