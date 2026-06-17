import { redirect } from "next/navigation";

/**
 * Cadastro de produto pelo admin foi desativado.
 * Admin é suporte: apenas visualiza, edita e exclui — nunca cadastra.
 * A rota é mantida só para redirecionar quem acessar a URL antiga.
 */
export default function NewProductPage() {
	redirect("/admin/products");
}
