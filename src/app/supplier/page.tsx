import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import SupplierDashboard from "./supplier-dashboard";

export default async function SupplierDashboardPage() {
	const user = await requireAuth();

	if (user.role !== "REPRESENTATIVE" && user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	return <SupplierDashboard user={user} />;
}
