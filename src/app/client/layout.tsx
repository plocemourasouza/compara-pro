import { redirect } from "next/navigation";
import AppHeader from "@/components/shared/app-header";
import { PageTransition } from "@/components/shared/page-transition";
import { getCurrentUser } from "@/lib/auth-server";
import ClientSidebar from "./client-sidebar";

export const dynamic = "force-dynamic";

export default async function ClientLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "CLIENT") {
		redirect(user.area === "REPRESENTATIVE" ? "/supplier" : "/admin");
	}

	return (
		<div className="min-h-screen bg-muted">
			<div className="flex min-h-screen">
				<ClientSidebar user={user} />
				<main className="flex flex-1 flex-col ml-64">
					<AppHeader
						user={user}
						notificationsHref="/client/notifications"
						settingsHref="/client/settings"
					/>
					<div className="flex min-h-0 flex-1 flex-col p-8">
						<PageTransition>{children}</PageTransition>
					</div>
				</main>
			</div>
		</div>
	);
}
