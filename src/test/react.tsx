/**
 * Harness para testes de componentes React (Testing Library + jest-dom).
 *
 * Todo `.test.tsx` que importar este módulo DEVE abrir com o docblock
 * de ambiente do Vitest (tag `@vitest-environment` com valor `jsdom`)
 * como primeira linha do arquivo — o ambiente padrão do vitest.config.ts
 * continua "node" para os 21 testes existentes, e é esse docblock por
 * arquivo que troca o ambiente apenas onde for necessário.
 *
 * Este módulo é importado explicitamente por cada teste, igual a
 * `prisma-mock.ts` e `auth-mock.ts` — NUNCA deve virar entrada de
 * `setupFiles` no vitest.config.ts, o que o carregaria globalmente em
 * todos os testes (incluindo os 21 de ambiente Node) sem necessidade.
 *
 * O import de "@testing-library/jest-dom/vitest" abaixo já registra os
 * matchers (toBeInTheDocument, etc.) no `expect` do Vitest e traz a
 * tipagem — não precisa de setup adicional.
 *
 * O cleanup automático da própria Testing Library não dispara aqui: com
 * `test.globals` em `false` (padrão deste projeto), `afterEach` não existe
 * como global, e a Testing Library só se registra quando encontra esse
 * global. Por isso o `afterEach(cleanup)` abaixo é obrigatório, não
 * decorativo.
 */
import "@testing-library/jest-dom/vitest";

import {
	act,
	cleanup,
	fireEvent,
	render,
	renderHook,
	screen,
} from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

export { act, fireEvent, render, renderHook, screen };
