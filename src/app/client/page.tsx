import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth-server";
import ClientDashboard from "./client-dashboard";

export default async function ClientDashboardPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN" && user.area !== "CLIENT") {
		redirect(user.area === "REPRESENTATIVE" ? "/supplier" : "/admin");
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
			<ClientDashboard user={user} />
		</ErrorBoundary>
	);
}
