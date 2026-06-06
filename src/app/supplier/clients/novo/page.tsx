import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-server";
import AddClientForm from "./add-client-form";

export default async function NewSupplierClientPage() {
	const user = await requireAuth();

	if (user.role !== "SUPPLIER") {
		redirect("/supplier");
	}

	return <AddClientForm />;
}
