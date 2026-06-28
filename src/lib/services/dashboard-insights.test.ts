import { describe, expect, it } from "vitest";
import { buildDashboardInsights, dayKey, pct } from "./dashboard-insights";

describe("pct", () => {
	it("retorna percentual com 1 casa decimal", () => {
		expect(pct(3, 4)).toBe(75);
		expect(pct(1, 3)).toBe(33.3);
	});

	it("denominador <= 0 → null (UI renderiza '—')", () => {
		expect(pct(0, 0)).toBeNull();
		expect(pct(5, 0)).toBeNull();
		expect(pct(5, -1)).toBeNull();
	});
});

describe("dayKey", () => {
	it("formata yyyy-mm-dd em UTC", () => {
		expect(dayKey(new Date("2026-06-28T15:30:00.000Z"))).toBe("2026-06-28");
	});
});

describe("buildDashboardInsights — escopo vazio (sem I/O)", () => {
	it("representante sem carteira → insights zerado", async () => {
		const out = await buildDashboardInsights({
			kind: "representative",
			supplierCompanyIds: [],
		});
		expect(out.funnel.preOrdersCreated).toBe(0);
		expect(out.gmv.approvalRatePct).toBeNull();
		expect(out.matching.matchRatePct).toBeNull();
		expect(out.leaderboards.topSuppliers).toEqual([]);
		expect(out.supplierBars).toEqual([]);
		expect(out.trend).toHaveLength(30);
	});

	it("cliente sem empresa → insights zerado", async () => {
		const out = await buildDashboardInsights({
			kind: "client",
			clientCompanyId: "",
		});
		expect(out.funnel.requirementUploads).toBe(0);
		expect(out.savings.estimatedSavings).toBe(0);
		expect(out.uploadHealth.failedRatePct).toBeNull();
		expect(out.trend).toHaveLength(30);
	});
});
