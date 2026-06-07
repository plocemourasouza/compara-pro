/**
 * Puro: monta o filtro `where` de pré-pedidos por papel.
 * ADMIN vê todos; CLIENT só os da própria empresa; REPRESENTATIVE os de todos
 * os fornecedores que representa. Sem I/O — seguro para testar isolado.
 */
export type PreOrderScope = {
	clientId?: string | null;
	supplierIds?: string[];
};
export type PreOrderRole = "CLIENT" | "REPRESENTATIVE" | "ADMIN";

export function preOrderScopeWhere(scope: PreOrderScope, role: PreOrderRole) {
	if (role === "ADMIN") return {};
	if (role === "CLIENT") return { clientId: scope.clientId ?? "" };
	return { supplierId: { in: scope.supplierIds ?? [] } };
}
