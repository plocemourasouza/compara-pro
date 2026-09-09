import { join } from "node:path";

/**
 * Arquivo com o instante ISO em que a rodada de E2E começou. O `global-setup`
 * escreve, o `scripts/cleanup-e2e.cjs` lê para saber o que foi criado pelos
 * testes e apaga em seguida. Fica fora do git (ver .gitignore).
 */
export const E2E_RUN_MARKER = join(process.cwd(), ".e2e-run-start");
