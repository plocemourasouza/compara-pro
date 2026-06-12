import { redirect } from "next/navigation";
import { PageTransition } from "@/components/shared/page-transition";
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

	if (user.area !== "ADMIN") {
		redirect(user.area === "REPRESENTATIVE" ? "/supplier" : "/client");
	}

	return (
		<div className="min-h-screen bg-muted">
			<div className="flex">
				<AdminSidebar user={user} />
				<main className="flex-1">
					<div className="p-8 ml-64">
						<PageTransition>{children}</PageTransition>
					</div>
				</main>
			</div>
		</div>
	);
}
