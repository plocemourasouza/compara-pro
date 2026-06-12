import { redirect } from "next/navigation";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import AddClientForm from "./add-client-form";

export default async function NewSupplierClientPage() {
	const user = await requireAuth();

	if (user.area !== "REPRESENTATIVE") {
		redirect("/supplier");
	}

	const ids = await getRepresentedSupplierIds(user);
	const suppliers = await prisma.company.findMany({
		where: { id: { in: ids }, deletedAt: null },
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	return <AddClientForm suppliers={suppliers} />;
}
