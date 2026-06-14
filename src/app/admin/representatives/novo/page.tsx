import { redirect } from "next/navigation";
import { CompanyForm } from "@/components/shared/company-form";
import { getCurrentUser } from "@/lib/auth-server";

export default async function NewRepresentativePage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	return (
		<CompanyForm
			mode="create"
			hideType
			showStatus
			defaultValues={{ type: "REPRESENTATIVE", status: "ACTIVE" }}
		/>
	);
}
