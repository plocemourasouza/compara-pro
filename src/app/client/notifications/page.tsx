import { redirect } from "next/navigation";
import { dashboardForArea } from "@/lib/area";
import { requireAuth } from "@/lib/auth-server";
import NotificationsClient from "./notifications-client";

export default async function ClientNotificationsPage() {
	const user = await requireAuth();

	if (user.area !== "CLIENT" && user.area !== "ADMIN") {
		redirect(dashboardForArea(user.area));
	}

	return <NotificationsClient />;
}
