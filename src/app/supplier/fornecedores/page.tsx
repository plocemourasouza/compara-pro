import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import FornecedoresClient from "./fornecedores-client";

export default async function FornecedoresPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	return <FornecedoresClient />;
}
