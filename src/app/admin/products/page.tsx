import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import ProductsClient from "./products-client";

export default async function ProductsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	return <ProductsClient user={user} />;
}
