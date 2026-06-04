import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import AdminSidebar from "./admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect(user.role === "SUPPLIER" ? "/supplier" : "/client");
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="flex">
				<AdminSidebar user={user} />
				<main className="flex-1">
					<div className="p-8 ml-64">{children}</div>
				</main>
			</div>
		</div>
	);
}
