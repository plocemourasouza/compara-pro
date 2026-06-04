import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import UsersClient from "./users-client";

export default async function UsersPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	return <UsersClient user={user} />;
}
