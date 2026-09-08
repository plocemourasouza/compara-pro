import { redirect } from "next/navigation";
import { dashboardForArea } from "@/lib/area";
import { getCurrentUser } from "@/lib/auth-server";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN") {
		redirect(dashboardForArea(user.area));
	}

	return <ReportsClient user={user} />;
}
