import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import IndicationsClient from "./indications-client";

export default async function SupplierIndicationsPage({
	params,
}: {
	params: Promise<{ id: string; uploadId: string }>;
}) {
	const user = await requireAuth();

	if (user.role !== "REPRESENTATIVE" && user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	const { id, uploadId } = await params;
	return <IndicationsClient clientId={id} uploadId={uploadId} />;
}
