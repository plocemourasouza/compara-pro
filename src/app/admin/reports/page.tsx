import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { ReportsClient } from "./reports-client";

export default async function ReportsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	return <ReportsClient user={user} />;
}
