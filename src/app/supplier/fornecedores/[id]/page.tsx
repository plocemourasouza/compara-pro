import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import FornecedorDetailClient from "./fornecedor-detail-client";

export default async function FornecedorDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	return <FornecedorDetailClient supplierId={id} />;
}
