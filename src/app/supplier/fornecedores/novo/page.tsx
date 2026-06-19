import { redirect } from "next/navigation";
import { SupplierForm } from "@/components/shared/supplier-form";
import { getCurrentUser } from "@/lib/auth-server";

export default async function NewSupplierPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	return <SupplierForm mode="create" listHref="/supplier/fornecedores" />;
}
