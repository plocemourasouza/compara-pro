import { redirect } from "next/navigation";
import { dashboardForArea } from "@/lib/area";
import { getCurrentUser } from "@/lib/auth-server";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "REPRESENTATIVE") {
		redirect(dashboardForArea(user.area));
	}

	return <SettingsClient user={user} />;
}
