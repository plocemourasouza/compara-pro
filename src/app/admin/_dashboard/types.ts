/** Shape returned by GET /api/admin/dashboard/insights (the `insights` field). */
export interface Insights {
	funnel: {
		requirementUploads: number;
		comparisons: number;
		preOrdersCreated: number;
		preOrdersFinalized: number;
	};
	trend: Array<{ date: string; uploads: number; preOrders: number }>;
	gmv: {
		totalPreOrderValue: number;
		finalizedValue: number;
		openValue: number;
		approvalRatePct: number | null;
	};
	savings: {
		finalizedSavings: number;
		itemsWithBaseline: number;
	};
	matching: {
		totalProducts: number;
		matchedProducts: number;
		matchRatePct: number | null;
		byType: { SKU: number; CODE: number; NAME: number; MANUAL: number };
		lowConfidenceCount: number;
	};
	attention: {
		pendingLinkRequests: number;
		agingLinkRequests: number;
		activePreOrders: number;
	};
	leaderboards: {
		topRepresentatives: Array<{
			representativeId: string;
			name: string;
			finalizedValue: number;
		}>;
		topClients: Array<{ companyId: string; name: string; spend: number }>;
	};
	uploadHealth: {
		total: number;
		failed: number;
		failedRatePct: number | null;
		totalErrorRows: number;
	};
}
