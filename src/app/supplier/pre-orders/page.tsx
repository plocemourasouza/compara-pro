import { redirect } from "next/navigation";
import { dashboardForArea } from "@/lib/area";
import { getCurrentUser } from "@/lib/auth-server";
import PreOrdersClient from "./pre-orders-client";

export default async function PreOrdersPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "REPRESENTATIVE") {
		redirect(dashboardForArea(user.area));
	}

	return <PreOrdersClient user={user} />;
}
