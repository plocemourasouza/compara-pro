import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import SuppliersClient from "./suppliers-client";

export default async function ClientSuppliersPage() {
	const user = await requireAuth();

	if (user.role !== "CLIENT" && user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	return <SuppliersClient />;
}
