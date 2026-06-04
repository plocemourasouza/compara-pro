import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN" && user.role !== "SUPPLIER") {
		redirect("/dashboard");
	}

	return <SettingsClient user={user} />;
}
