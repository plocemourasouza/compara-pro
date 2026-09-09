import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { E2E_RUN_MARKER } from "./run-marker";

/**
 * Garante os dados de demonstração antes da suíte (o seed é idempotente) e
 * grava o marcador de início da rodada.
 *
 * O marcador é escrito DEPOIS do seed de propósito: assim nada que o seed
 * cria entra na janela de varredura do teardown. Tudo que aparecer no banco a
 * partir daí foi criado pelos testes.
 */
export default function globalSetup() {
	try {
		execSync("node scripts/seed-demo.cjs", { stdio: "ignore" });
	} catch {
		// Seed skips when data already exists — safe to ignore.
	}
	writeFileSync(E2E_RUN_MARKER, new Date().toISOString(), "utf-8");
}
