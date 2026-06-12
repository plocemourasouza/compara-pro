import { redirect } from "next/navigation";
import HydrationFix from "@/components/hydration-fix";
import { getCurrentUser } from "@/lib/auth-server";
import CompaniesClient from "./companies-client";

export default async function CompaniesPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	return (
		<HydrationFix
			fallback={
				<div className="flex items-center justify-center min-h-[400px]">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
						<p className="mt-2 text-sm text-muted-foreground">
							Carregando empresas...
						</p>
					</div>
				</div>
			}
		>
			<CompaniesClient user={user} />
		</HydrationFix>
	);
}
