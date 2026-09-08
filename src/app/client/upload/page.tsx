import { redirect } from "next/navigation";
import { dashboardForArea } from "@/lib/area";
import { getCurrentUser } from "@/lib/auth-server";
import UploadClient from "./upload-client";

export default async function UploadPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area === "ADMIN") {
		redirect(dashboardForArea(user.area));
	}

	return <UploadClient user={user} />;
}
