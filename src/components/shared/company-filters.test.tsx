/** @vitest-environment jsdom */
import type { DateRange } from "react-day-picker";
import { describe, expect, it } from "vitest";
import type { Company } from "@/app/admin/companies/columns";
import { act, renderHook } from "@/test/react";
import { useCompanyFilters } from "./company-filters";

// Fixa o fuso local em -03:00 (sem DST) para que `setHours` — que o hook usa
// em cima de `createdAt` (string UTC) — produza instantes determinísticos e
// reproduzíveis neste teste, independente do fuso da máquina que roda o suite.
process.env.TZ = "America/Sao_Paulo";

let seq = 0;
function makeCompany(overrides: Partial<Company> = {}): Company {
	seq += 1;
	return {
		id: `co-${seq}`,
		name: `Empresa ${seq}`,
		type: "CLIENT",
		createdAt: "2026-01-01T00:00:00.000Z",
		updatedAt: "2026-01-01T00:00:00.000Z",
		...overrides,
	};
}

describe("useCompanyFilters", () => {
	describe("estado inicial", () => {
		it("statusFilter começa em ACTIVE (não 'all'), demais em 'all'/undefined", () => {
			const { result } = renderHook(() => useCompanyFilters([]));
			expect(result.current.statusFilter).toBe("ACTIVE");
			expect(result.current.stateFilter).toBe("all");
			expect(result.current.cityFilter).toBe("all");
			expect(result.current.dateRange).toBeUndefined();
		});
	});

	describe("stateOptions", () => {
		it("dedupe, remove null/vazio e ordena com localeCompare pt-BR (acentos)", () => {
			const companies = [
				makeCompany({ state: "Ceará" }),
				makeCompany({ state: "Água Boa" }),
				makeCompany({ state: "Belo Horizonte" }),
				makeCompany({ state: "Ceará" }), // duplicata
				makeCompany({ state: null as unknown as string }),
				makeCompany({ state: "" }),
			];
			const { result } = renderHook(() => useCompanyFilters(companies));

			// Sob ordenação naïve por `<` (UTF-16), "Ceará" e "Belo Horizonte"
			// viriam antes de "Água Boa" por causa do código do 'Á'; localeCompare
			// pt-BR corrige isso tratando o acento como variação da letra base.
			expect(result.current.stateOptions).toEqual([
				"Água Boa",
				"Belo Horizonte",
				"Ceará",
			]);
		});
	});

	describe("cityOptions: forma da opção ({ value, label })", () => {
		it("stateFilter !== 'all' → value e label são o nome puro da cidade", () => {
			const companies = [
				makeCompany({ state: "RS", city: "Porto Alegre" }),
				makeCompany({ state: "SP", city: "Campinas" }),
			];
			const { result } = renderHook(() => useCompanyFilters(companies));

			act(() => result.current.setStateFilter("RS"));

			expect(result.current.cityOptions).toEqual([
				{ value: "Porto Alegre", label: "Porto Alegre" },
			]);
		});
	});

	describe("cityOptions em cascata sobre o Estado", () => {
		it("stateFilter 'all' → cidades de todos os estados, com label 'cidade — estado'", () => {
			const companies = [
				makeCompany({ state: "RS", city: "Porto Alegre" }),
				makeCompany({ state: "SP", city: "Campinas" }),
			];
			const { result } = renderHook(() => useCompanyFilters(companies));
			expect(result.current.cityOptions).toEqual([
				{ value: "SP::Campinas", label: "Campinas — SP" },
				{ value: "RS::Porto Alegre", label: "Porto Alegre — RS" },
			]);
		});

		it("setStateFilter('RS') → restringe às cidades do RS", () => {
			const companies = [
				makeCompany({ state: "RS", city: "Porto Alegre" }),
				makeCompany({ state: "RS", city: "Caxias do Sul" }),
				makeCompany({ state: "SP", city: "Campinas" }),
			];
			const { result } = renderHook(() => useCompanyFilters(companies));

			act(() => result.current.setStateFilter("RS"));

			expect(result.current.cityOptions).toEqual([
				{ value: "Caxias do Sul", label: "Caxias do Sul" },
				{ value: "Porto Alegre", label: "Porto Alegre" },
			]);
		});

		it("São Paulo/SP e São Paulo/MG NÃO colapsam: permanecem opções distintas", () => {
			// A identidade da opção é o par estado+cidade (chave composta
			// "<estado>::<cidade>"), não só o nome — então duas cidades homônimas
			// em estados diferentes viram duas opções, com o estado no label para
			// o usuário distinguir.
			const companies = [
				makeCompany({ state: "SP", city: "São Paulo" }),
				makeCompany({ state: "MG", city: "São Paulo" }),
			];
			const { result } = renderHook(() => useCompanyFilters(companies));
			expect(result.current.cityOptions).toEqual([
				{ value: "MG::São Paulo", label: "São Paulo — MG" },
				{ value: "SP::São Paulo", label: "São Paulo — SP" },
			]);
		});
	});

	describe("efeito de auto-reset da cidade quando o Estado muda", () => {
		it("cidade selecionada some da lista → reseta para 'all'", async () => {
			const companies = [
				makeCompany({ state: "RS", city: "Porto Alegre" }),
				makeCompany({ state: "SP", city: "Campinas" }),
			];
			const { result } = renderHook(() => useCompanyFilters(companies));

			act(() => result.current.setStateFilter("RS"));
			act(() => result.current.setCityFilter("Porto Alegre"));
			expect(result.current.cityFilter).toBe("Porto Alegre");

			act(() => result.current.setStateFilter("SP"));

			expect(result.current.cityFilter).toBe("all");
		});

		it("caso negativo: cidade continua válida no novo estado → NÃO reseta", () => {
			const companies = [
				makeCompany({ state: "RS", city: "Porto Alegre" }),
				makeCompany({ state: "RS", city: "Caxias do Sul" }),
			];
			const { result } = renderHook(() => useCompanyFilters(companies));

			act(() => result.current.setStateFilter("RS"));
			act(() => result.current.setCityFilter("Porto Alegre"));

			// Muda o estado para o mesmo estado (RS) — cityOptions não muda,
			// "Porto Alegre" continua na lista.
			act(() => result.current.setStateFilter("RS"));

			expect(result.current.cityFilter).toBe("Porto Alegre");
		});

		it("guarda cityFilter !== 'all' evita um setCityFilter redundante quando já está em 'all'", () => {
			// A condição `cityFilter !== "all" && !cityOptions.includes(cityFilter)`
			// só chama setCityFilter quando a cidade atual saiu da lista. Com
			// cityFilter já em "all", o efeito não chama setCityFilter nenhuma vez
			// — conta os renders do hook para confirmar que a única mudança de
			// render vem da nova prop `companies`, nenhum extra do efeito.
			let renders = 0;
			const { rerender, result } = renderHook(
				({ companies }: { companies: Company[] }) => {
					renders++;
					return useCompanyFilters(companies);
				},
				{
					initialProps: {
						companies: [makeCompany({ state: "RS", city: "Porto Alegre" })],
					},
				},
			);
			expect(result.current.cityFilter).toBe("all");
			const rendersAfterMount = renders;

			act(() => {
				rerender({
					companies: [makeCompany({ state: "RS", city: "Caxias do Sul" })],
				});
			});

			expect(result.current.cityFilter).toBe("all");
			// Exatamente 1 render a mais (o da nova prop) — nenhum causado pelo efeito.
			expect(renders).toBe(rendersAfterMount + 1);
		});
	});

	describe("predicate", () => {
		it("status: c.status ?? 'ACTIVE' passa no filtro padrão quando status é undefined", () => {
			const { result } = renderHook(() => useCompanyFilters([]));
			const company = makeCompany({ status: undefined });
			expect(result.current.predicate(company)).toBe(true);
		});

		it("statusFilter 'all' ignora o status da empresa (short-circuit)", () => {
			const { result } = renderHook(() => useCompanyFilters([]));
			act(() => result.current.setStatusFilter("all"));
			expect(result.current.predicate(makeCompany({ status: "BLOCKED" }))).toBe(
				true,
			);
		});

		it("state: exige igualdade exata quando stateFilter !== 'all'", () => {
			const { result } = renderHook(() => useCompanyFilters([]));
			act(() => result.current.setStateFilter("RS"));
			expect(result.current.predicate(makeCompany({ state: "RS" }))).toBe(true);
			expect(result.current.predicate(makeCompany({ state: "SP" }))).toBe(
				false,
			);
		});

		it("city: exige igualdade exata quando cityFilter !== 'all'", () => {
			// Precisa existir nas companies passadas ao hook: senão o efeito de
			// auto-reset (cityOptions não contém "Porto Alegre") derruba o filtro
			// de volta para "all" antes do predicate ser lido.
			const { result } = renderHook(() =>
				useCompanyFilters([makeCompany({ city: "Porto Alegre" })]),
			);
			act(() => result.current.setCityFilter("Porto Alegre"));
			expect(
				result.current.predicate(makeCompany({ city: "Porto Alegre" })),
			).toBe(true);
			expect(result.current.predicate(makeCompany({ city: "Campinas" }))).toBe(
				false,
			);
		});

		it("city: com stateFilter 'all', escolher uma cidade homônima não vaza empresas do outro estado", () => {
			const spCompany = makeCompany({ state: "SP", city: "São Paulo" });
			const mgCompany = makeCompany({ state: "MG", city: "São Paulo" });
			const { result } = renderHook(() =>
				useCompanyFilters([spCompany, mgCompany]),
			);

			const spOption = result.current.cityOptions.find(
				(o) => o.label === "São Paulo — SP",
			);
			expect(spOption).toBeDefined();
			act(() => result.current.setCityFilter(spOption?.value ?? ""));

			expect(result.current.predicate(spCompany)).toBe(true);
			expect(result.current.predicate(mgCompany)).toBe(false);
		});

		describe("janela de datas (createdAt vs dateRange)", () => {
			it("só 'from' → limite superior aberto (nada no futuro é excluído)", () => {
				const from = new Date(2026, 0, 1); // 1º jan 2026, local
				const { result } = renderHook(() => useCompanyFilters([]));
				act(() =>
					result.current.setDateRange({ from, to: undefined } as DateRange),
				);

				expect(
					result.current.predicate(
						makeCompany({ createdAt: "2099-01-01T00:00:00.000Z" }),
					),
				).toBe(true);
				expect(
					result.current.predicate(
						makeCompany({ createdAt: "2020-01-01T00:00:00.000Z" }),
					),
				).toBe(false);
			});

			it("só 'to' → limite inferior aberto (nada no passado é excluído)", () => {
				const to = new Date(2026, 0, 31);
				const { result } = renderHook(() => useCompanyFilters([]));
				act(() =>
					result.current.setDateRange({ from: undefined, to } as DateRange),
				);

				expect(
					result.current.predicate(
						makeCompany({ createdAt: "1999-01-01T00:00:00.000Z" }),
					),
				).toBe(true);
				expect(
					result.current.predicate(
						makeCompany({ createdAt: "2099-01-01T00:00:00.000Z" }),
					),
				).toBe(false);
			});

			it("inclusividade de fronteira: exatamente em 'from' 00:00:00.000 passa, 1ms antes falha", () => {
				const from = new Date(2026, 5, 1); // 1º jun 2026, local (TZ fixo acima)
				const { result } = renderHook(() => useCompanyFilters([]));
				act(() =>
					result.current.setDateRange({ from, to: undefined } as DateRange),
				);

				// Mesmo cálculo que o hook faz internamente: `setHours(0,0,0,0)`
				// sobre `dateRange.from`, para não fixar o instante "no chute".
				const fromTime = new Date(from).setHours(0, 0, 0, 0);

				expect(
					result.current.predicate(
						makeCompany({ createdAt: new Date(fromTime).toISOString() }),
					),
				).toBe(true);
				expect(
					result.current.predicate(
						makeCompany({ createdAt: new Date(fromTime - 1).toISOString() }),
					),
				).toBe(false);
			});

			it("inclusividade de fronteira: exatamente em 'to' 23:59:59.999 passa, 1ms depois falha", () => {
				const to = new Date(2026, 5, 30);
				const { result } = renderHook(() => useCompanyFilters([]));
				act(() =>
					result.current.setDateRange({ from: undefined, to } as DateRange),
				);

				const toTime = new Date(to).setHours(23, 59, 59, 999);

				expect(
					result.current.predicate(
						makeCompany({ createdAt: new Date(toTime).toISOString() }),
					),
				).toBe(true);
				expect(
					result.current.predicate(
						makeCompany({ createdAt: new Date(toTime + 1).toISOString() }),
					),
				).toBe(false);
			});

			it("aceita createdAt tanto como string ISO quanto como Date", () => {
				const from = new Date(2026, 5, 1);
				const { result } = renderHook(() => useCompanyFilters([]));
				act(() =>
					result.current.setDateRange({ from, to: undefined } as DateRange),
				);
				const fromTime = new Date(from).setHours(0, 0, 0, 0);

				const asString = makeCompany({
					createdAt: new Date(fromTime).toISOString(),
				});
				// `Company.createdAt` é tipado como string, mas em runtime o hook faz
				// `new Date(c.createdAt)`, que também aceita um `Date` — cobrindo o
				// dado como normalmente chega (serializado) e como pode chegar cru.
				const asDate = {
					...makeCompany(),
					createdAt: new Date(fromTime) as unknown as string,
				};

				expect(result.current.predicate(asString)).toBe(true);
				expect(result.current.predicate(asDate)).toBe(true);
			});
		});

		it("identidade referencial: estável entre re-renders com deps inalteradas, muda quando dateRange muda", () => {
			const companies = [makeCompany()];
			const { rerender, result } = renderHook(
				({ companies }: { companies: Company[] }) =>
					useCompanyFilters(companies),
				{ initialProps: { companies } },
			);
			const firstPredicate = result.current.predicate;

			// Nova referência de array, mesmos filtros → predicate não depende de
			// `companies`, então a identidade deve se manter.
			rerender({ companies: [...companies] });
			expect(result.current.predicate).toBe(firstPredicate);

			act(() =>
				result.current.setDateRange({
					from: new Date(2026, 0, 1),
					to: undefined,
				} as DateRange),
			);
			expect(result.current.predicate).not.toBe(firstPredicate);
		});
	});
});
