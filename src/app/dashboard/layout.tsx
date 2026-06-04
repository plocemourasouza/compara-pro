import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth-server";
import DashboardHeader from "./header";

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
		<div className="min-h-screen bg-gray-50">
			<DashboardHeader user={user} />
			<div className="flex">
				<main className="flex-1 p-6">{children}</main>
			</div>
		</div>
	);
}
