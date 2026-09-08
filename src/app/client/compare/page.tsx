import { redirect } from "next/navigation";
import { dashboardForArea } from "@/lib/area";
import { getCurrentUser } from "@/lib/auth-server";
import CompareClient from "./compare-client";

export default async function ComparePage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "CLIENT") {
		redirect(dashboardForArea(user.area));
	}

	return <CompareClient user={user} />;
}
