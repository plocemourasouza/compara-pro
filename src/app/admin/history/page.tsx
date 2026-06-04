import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import HistoryClient from "./history-client";

export default async function HistoryPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	return <HistoryClient user={user} />;
}
