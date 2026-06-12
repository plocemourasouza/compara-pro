import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import NotificationsClient from "./notifications-client";

export default async function SupplierNotificationsPage() {
	const user = await requireAuth();

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	return <NotificationsClient />;
}
