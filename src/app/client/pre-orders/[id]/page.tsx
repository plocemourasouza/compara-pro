import { redirect } from "next/navigation";
import { PreOrderDetailView } from "@/components/shared/pre-order-detail-view";
import { getCurrentUser } from "@/lib/auth-server";

export default async function ClientPreOrderDetailPage({
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
	return <PreOrderDetailView preOrderId={id} backHref="/client/pre-orders" />;
}
