import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import NotificationsClient from "./notifications-client";

export default async function ClientNotificationsPage() {
	const user = await requireAuth();

	if (user.area !== "CLIENT" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	return <NotificationsClient />;
}
