import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import SupplierDashboard from "./supplier-dashboard";

export default async function SupplierDashboardPage() {
	const user = await requireAuth();

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	return <SupplierDashboard user={user} />;
}
