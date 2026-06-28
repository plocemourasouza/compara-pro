import { redirect } from "next/navigation";
import AppHeader from "@/components/shared/app-header";
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
		<div className="h-screen overflow-hidden bg-muted">
			<div className="flex h-full">
				<AdminSidebar user={user} />
				<main className="flex min-h-0 flex-1 flex-col ml-64">
					<AppHeader
						user={user}
						notificationsHref="/admin/notifications"
						settingsHref="/admin/settings"
					/>
					<div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-8">
						<PageTransition>{children}</PageTransition>
					</div>
				</main>
			</div>
		</div>
	);
}
