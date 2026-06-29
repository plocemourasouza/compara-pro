import { redirect } from "next/navigation";
import { SupplierForm } from "@/components/shared/supplier-form";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export default async function NewSupplierPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/dashboard");
	}

	// Admin escolhe a agência (representante) dona do vínculo.
	const agencies =
		user.area === "ADMIN"
			? await prisma.company.findMany({
					where: { type: "REPRESENTATIVE", deletedAt: null },
					select: { id: true, name: true },
					orderBy: { name: "asc" },
				})
			: [];

	return (
		<SupplierForm
			mode="create"
			listHref="/supplier/fornecedores"
			isAdmin={user.area === "ADMIN"}
			agencies={agencies}
		/>
	);
}
