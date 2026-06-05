import { execSync } from "node:child_process";

/** Ensure the demo data exists before the E2E run (seed is idempotent). */
export default function globalSetup() {
	try {
		execSync("node scripts/seed-demo.cjs", { stdio: "ignore" });
	} catch {
		// Seed skips when data already exists — safe to ignore.
	}
}
