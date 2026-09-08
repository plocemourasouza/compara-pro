import { redirect } from "next/navigation";
import { UploadItemsView } from "@/components/shared/upload-items-view";
import { dashboardForArea } from "@/lib/area";
import { getCurrentUser } from "@/lib/auth-server";

export default async function SupplierUploadItemsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "REPRESENTATIVE") {
		redirect(dashboardForArea(user.area));
	}

	const { id } = await params;
	return <UploadItemsView uploadId={id} backHref="/supplier/history" />;
}
