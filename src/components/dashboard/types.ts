/**
 * Tipos dos widgets de dashboard. Fonte única = o serviço de insights.
 * Re-export type-only: apagado em runtime, então nenhum código de servidor
 * (Prisma/db) entra no bundle do cliente.
 */
export type {
	AttentionData,
	DashboardInsights,
	FunnelData,
	GmvData,
	LeaderboardsData,
	MatchingData,
	SavingsData,
	SupplierBarDatum,
	TrendPoint,
	UploadHealthData,
} from "@/lib/services/dashboard-insights";
