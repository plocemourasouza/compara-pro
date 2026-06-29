import { redirect } from "next/navigation";
import { UploadItemsView } from "@/components/shared/upload-items-view";
import { getCurrentUser } from "@/lib/auth-server";

export default async function ClientUploadItemsPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "CLIENT") {
		redirect("/dashboard");
	}

	const { id } = await params;
	return <UploadItemsView uploadId={id} backHref="/client/history" />;
}
