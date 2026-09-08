import { redirect } from "next/navigation";
import { dashboardForArea } from "@/lib/area";
import { requireAuth } from "@/lib/auth-server";
import IndicationsClient from "./indications-client";

export default async function SupplierIndicationsPage({
	params,
}: {
	params: Promise<{ id: string; uploadId: string }>;
}) {
	const user = await requireAuth();

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect(dashboardForArea(user.area));
	}

	const { id, uploadId } = await params;
	return <IndicationsClient clientId={id} uploadId={uploadId} />;
}
