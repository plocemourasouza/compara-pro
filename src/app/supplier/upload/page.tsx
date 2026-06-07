import { redirect } from "next/navigation";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import SupplierUploadClient from "../supplier-upload-client";

export default async function SupplierUploadPage() {
	const user = await requireAuth();

	if (user.role !== "REPRESENTATIVE" && user.role !== "ADMIN") {
		redirect("/dashboard");
	}

	const ids = await getRepresentedSupplierIds(user);
	const suppliers = await prisma.company.findMany({
		where: { id: { in: ids }, deletedAt: null },
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	return <SupplierUploadClient user={user} suppliers={suppliers} />;
}
