import { redirect } from "next/navigation";
import { CompanyForm } from "@/components/shared/company-form";
import { getCurrentUser } from "@/lib/auth-server";

export default async function NewCompanyPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	return <CompanyForm mode="create" />;
}
