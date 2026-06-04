import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import CompareClient from "./compare-client";

export default async function ComparePage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "CLIENT") {
		redirect("/dashboard");
	}

	return <CompareClient user={user} />;
}
