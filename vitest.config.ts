import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.{ts,tsx}"],
		env: {
			JWT_SECRET: "vitest-jwt-secret-not-for-production",
		},
	},
});
