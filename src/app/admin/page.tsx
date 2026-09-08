import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth-server";
import AdminDashboard from "./admin-dashboard";

export default async function AdminDashboardPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN") {
		redirect(user.area === "REPRESENTATIVE" ? "/supplier" : "/client");
	}

	return (
		<ErrorBoundary
			fallback={
				<Card>
					<CardContent className="py-12 text-center text-muted-foreground">
						<AlertTriangle className="mx-auto mb-2 h-8 w-8 text-destructive" />
						Não foi possível carregar o dashboard.
					</CardContent>
				</Card>
			}
		>
			<AdminDashboard user={user} />
		</ErrorBoundary>
	);
}
