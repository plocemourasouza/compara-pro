import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import PreOrdersClient from "./pre-orders-client";

export default async function PreOrdersPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN" && user.role !== "REPRESENTATIVE") {
		redirect("/dashboard");
	}

	return <PreOrdersClient user={user} />;
}
