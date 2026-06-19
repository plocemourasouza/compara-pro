import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AppHeader from "@/components/shared/app-header";
import { getCurrentUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
	children: ReactNode;
}

export default async function DashboardLayout({
	children,
}: DashboardLayoutProps) {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	return (
		<div className="min-h-screen bg-muted">
			<AppHeader user={user} />
			<div className="flex">
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
