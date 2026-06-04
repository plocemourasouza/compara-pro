import { requireAuth } from "@/lib/auth-server";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
	const user = await requireAuth();

	return <SettingsClient user={user} />;
}
