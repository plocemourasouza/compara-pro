import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import ClientDetailClient from "./client-detail-client";

export default async function SupplierClientDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await requireAuth();

	if (user.role !== "SUPPLIER" && user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	const { id } = await params;
	return <ClientDetailClient clientId={id} />;
}
