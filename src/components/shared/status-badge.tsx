import { Badge } from "@/components/ui/badge";

export type CompanyStatus = "ACTIVE" | "BLOCKED" | "INACTIVE";

export const STATUS_LABELS: Record<CompanyStatus, string> = {
	ACTIVE: "Ativo",
	BLOCKED: "Bloqueado",
	INACTIVE: "Inativo",
};

const STATUS_STYLES: Record<CompanyStatus, string> = {
	ACTIVE: "border-transparent bg-success/10 text-success",
	BLOCKED: "border-transparent bg-amber-500/10 text-amber-600",
	INACTIVE: "border-transparent bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status?: CompanyStatus }) {
	const value = status ?? "ACTIVE";
	return <Badge className={STATUS_STYLES[value]}>{STATUS_LABELS[value]}</Badge>;
}
