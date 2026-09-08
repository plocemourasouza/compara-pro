import { redirect } from "next/navigation";
import { CompanyForm } from "@/components/shared/company-form";
import { dashboardForArea } from "@/lib/area";
import { getCurrentUser } from "@/lib/auth-server";

export default async function NewCompanyPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN") {
		redirect(dashboardForArea(user.area));
	}

	return <CompanyForm mode="create" />;
}
