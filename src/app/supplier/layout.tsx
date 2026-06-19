import { redirect } from "next/navigation";
import AppHeader from "@/components/shared/app-header";
import { PageTransition } from "@/components/shared/page-transition";
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

	if (user.area !== "ADMIN" && user.area !== "REPRESENTATIVE") {
		redirect("/client");
	}

	return (
		<div className="min-h-screen bg-muted">
			<div className="flex min-h-screen">
				<SupplierSidebar user={user} />
				<main className="flex flex-1 flex-col ml-64">
					<AppHeader
						user={user}
						notificationsHref="/supplier/notifications"
						settingsHref="/supplier/settings"
					/>
					<div className="flex min-h-0 flex-1 flex-col p-8">
						<PageTransition>{children}</PageTransition>
					</div>
				</main>
			</div>
		</div>
	);
}
