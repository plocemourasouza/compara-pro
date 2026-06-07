import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import NotificationsClient from "./notifications-client";

export default async function SupplierNotificationsPage() {
	const user = await requireAuth();

	if (user.role !== "REPRESENTATIVE" && user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	return <NotificationsClient />;
}
