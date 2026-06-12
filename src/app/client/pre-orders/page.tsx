import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import PreOrdersClient from "./pre-orders-client";

export default async function ClientPreOrdersPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "CLIENT") {
		redirect("/dashboard");
	}

	return <PreOrdersClient user={user} />;
}
