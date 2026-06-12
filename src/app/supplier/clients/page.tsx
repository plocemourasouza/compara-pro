import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import ClientsClient from "./clients-client";

export default async function SupplierClientsPage() {
	const user = await requireAuth();

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	return <ClientsClient />;
}
