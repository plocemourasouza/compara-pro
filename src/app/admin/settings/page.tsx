import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import {
	DEFAULT_PREFERENCES,
	preferencesSchema,
} from "@/lib/validations/preferences";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.role !== "ADMIN") {
		redirect(user.role === "REPRESENTATIVE" ? "/supplier" : "/client");
	}

	const row = await prisma.user.findUnique({
		where: { id: user.id },
		select: { preferences: true },
	});
	const parsed = preferencesSchema.safeParse(row?.preferences);
	const initialPreferences = parsed.success ? parsed.data : DEFAULT_PREFERENCES;

	return <SettingsClient user={user} initialPreferences={initialPreferences} />;
}
