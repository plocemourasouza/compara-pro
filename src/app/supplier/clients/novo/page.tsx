import { redirect } from "next/navigation";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import AddClientForm from "./add-client-form";

export default async function NewSupplierClientPage() {
	const user = await requireAuth();

	if (user.area !== "REPRESENTATIVE" && user.area !== "ADMIN") {
		redirect("/supplier");
	}

	if (user.area === "ADMIN") {
		// Admin escolhe Fornecedor + Agência (dona do vínculo).
		const [suppliers, agencies, rels] = await Promise.all([
			prisma.company.findMany({
				where: { type: "SUPPLIER", deletedAt: null },
				select: { id: true, name: true },
				orderBy: { name: "asc" },
			}),
			prisma.company.findMany({
				where: { type: "REPRESENTATIVE", deletedAt: null },
				select: { id: true, name: true },
				orderBy: { name: "asc" },
			}),
			prisma.representativeSupplier.findMany({
				select: { representativeCompanyId: true, supplierCompanyId: true },
			}),
		]);
		// Mapa agência → fornecedores que ela representa (filtra o select).
		const repSuppliers: Record<string, string[]> = {};
		for (const r of rels) {
			const list = repSuppliers[r.representativeCompanyId] ?? [];
			list.push(r.supplierCompanyId);
			repSuppliers[r.representativeCompanyId] = list;
		}
		return (
			<AddClientForm
				isAdmin
				suppliers={suppliers}
				agencies={agencies}
				repSuppliers={repSuppliers}
			/>
		);
	}

	const ids = await getRepresentedSupplierIds(user);
	const suppliers = await prisma.company.findMany({
		where: { id: { in: ids }, deletedAt: null },
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	return <AddClientForm suppliers={suppliers} />;
}
