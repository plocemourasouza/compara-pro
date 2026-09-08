import { AlertTriangle } from "lucide-react";
import { redirect } from "next/navigation";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { Card, CardContent } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth-server";
import SupplierDashboard from "./supplier-dashboard";

export default async function SupplierDashboardPage() {
	const user = await requireAuth();

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
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
			<SupplierDashboard user={user} />
		</ErrorBoundary>
	);
}
