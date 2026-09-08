import { execSync } from "node:child_process";

/** Varre as empresas/usuários órfãos deixados pelo E2E após a suíte rodar. */
export default function globalTeardown() {
	try {
		execSync("node scripts/cleanup-e2e.cjs", { stdio: "ignore" });
	} catch {
		// Um teardown nunca deve derrubar a suíte — falha aqui é apenas logada.
	}
}
