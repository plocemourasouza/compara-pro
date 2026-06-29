import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import HistoryClient from "./history-client";

export default async function HistoryPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	const suppliers = await prisma.company.findMany({
		where: { type: "SUPPLIER", deletedAt: null },
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	return <HistoryClient user={user} suppliers={suppliers} />;
}
