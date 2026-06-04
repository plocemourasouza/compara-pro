import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import SupplierUploadClient from "./supplier-upload-client";

export default async function SupplierUploadPage() {
	const user = await requireAuth();

	if (user.role !== "SUPPLIER") {
		redirect("/dashboard");
	}

	return <SupplierUploadClient user={user} />;
}
