import { redirect } from "next/navigation";
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

	if (user.role !== "ADMIN" && user.role !== "CLIENT") {
		redirect(user.role === "REPRESENTATIVE" ? "/supplier" : "/admin");
	}

	return (
		<div className="min-h-screen bg-muted">
			<div className="flex">
				<ClientSidebar user={user} />
				<main className="flex-1 ml-64">
					<div className="p-8">
						<PageTransition>{children}</PageTransition>
					</div>
				</main>
			</div>
		</div>
	);
}
