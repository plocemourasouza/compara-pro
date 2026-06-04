import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import SupplierSidebar from "./supplier-sidebar";

export const dynamic = "force-dynamic";

export default async function SupplierLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN" && user.role !== "SUPPLIER") {
		redirect("/client");
	}

	return (
		<div className="min-h-screen bg-muted">
			<div className="flex">
				<SupplierSidebar user={user} />
				<main className="flex-1 ml-64">
					<div className="p-8">{children}</div>
				</main>
			</div>
		</div>
	);
}
