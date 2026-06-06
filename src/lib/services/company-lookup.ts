/**
 * Consultas externas para auto-preenchimento do cadastro de empresa.
 * - CNPJ: API aberta da CNPJÁ (https://open.cnpja.com) — sem chave, rate-limited.
 * - CEP: BrasilAPI CEP v2 (https://brasilapi.com.br).
 * Chamadas feitas server-side (sem CORS); shape normalizado para o formulário.
 */

const CNPJA_BASE = "https://open.cnpja.com";
const BRASILAPI_CEP = "https://brasilapi.com.br/api/cep/v2";
const VIACEP_BASE = "https://viacep.com.br/ws";

export type TaxRegimeHint = "MEI" | "SIMPLES_NACIONAL";

export interface CnpjLookupResult {
	name: string;
	legalName: string;
	email: string;
	phone: string; // dígitos (área + número); o cliente aplica a máscara
	taxRegime?: TaxRegimeHint;
	address: {
		zipCode: string;
		street: string;
		number: string;
		neighborhood: string;
		city: string;
		state: string;
	};
}

export interface CepLookupResult {
	street: string;
	neighborhood: string;
	city: string;
	state: string;
}

export class LookupError extends Error {
	readonly status: number;
	constructor(message: string, status: number) {
		super(message);
		this.name = "LookupError";
		this.status = status;
	}
}

function onlyDigits(value: string): string {
	return value.replace(/\D/g, "");
}

export async function lookupCnpj(raw: string): Promise<CnpjLookupResult> {
	const cnpj = onlyDigits(raw);
	if (cnpj.length !== 14) {
		throw new LookupError("CNPJ inválido", 400);
	}

	const res = await fetch(`${CNPJA_BASE}/office/${cnpj}`, {
		headers: { Accept: "application/json" },
		signal: AbortSignal.timeout(10_000),
	});

	if (res.status === 404) throw new LookupError("CNPJ não encontrado", 404);
	if (res.status === 429) {
		throw new LookupError(
			"Muitas consultas. Tente novamente em instantes.",
			429,
		);
	}
	if (!res.ok) throw new LookupError("Falha ao consultar o CNPJ", 502);

	// biome-ignore lint/suspicious/noExplicitAny: resposta externa não tipada
	const d: any = await res.json();

	const firstPhone = d.phones?.[0];
	const phone = firstPhone
		? `${firstPhone.area ?? ""}${firstPhone.number ?? ""}`
		: "";

	const taxRegime: TaxRegimeHint | undefined = d.company?.simei?.optant
		? "MEI"
		: d.company?.simples?.optant
			? "SIMPLES_NACIONAL"
			: undefined;

	const a = d.address ?? {};
	return {
		name: d.alias || d.company?.name || "",
		legalName: d.company?.name || "",
		email: d.emails?.[0]?.address || "",
		phone,
		taxRegime,
		address: {
			zipCode: a.zip || "",
			street: a.street || "",
			number: a.number && a.number !== "SN" ? String(a.number) : "",
			neighborhood: a.district || "",
			city: a.city || "",
			state: a.state || "",
		},
	};
}

async function fetchBrasilApiCep(cep: string): Promise<CepLookupResult | null> {
	try {
		const res = await fetch(`${BRASILAPI_CEP}/${cep}`, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(8_000),
		});
		if (!res.ok) return null;
		// biome-ignore lint/suspicious/noExplicitAny: resposta externa não tipada
		const d: any = await res.json();
		return {
			street: d.street || "",
			neighborhood: d.neighborhood || "",
			city: d.city || "",
			state: d.state || "",
		};
	} catch {
		return null;
	}
}

async function fetchViaCep(cep: string): Promise<CepLookupResult | null> {
	try {
		const res = await fetch(`${VIACEP_BASE}/${cep}/json/`, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(8_000),
		});
		if (!res.ok) return null;
		// biome-ignore lint/suspicious/noExplicitAny: resposta externa não tipada
		const d: any = await res.json();
		if (d.erro) return null;
		return {
			street: d.logradouro || "",
			neighborhood: d.bairro || "",
			city: d.localidade || "",
			state: d.uf || "",
		};
	} catch {
		return null;
	}
}

export async function lookupCep(raw: string): Promise<CepLookupResult> {
	const cep = onlyDigits(raw);
	if (cep.length !== 8) {
		throw new LookupError("CEP inválido", 400);
	}

	const primary = await fetchBrasilApiCep(cep);
	// BrasilAPI corre vários provedores e às vezes vem sem logradouro/bairro;
	// completa com o ViaCEP quando faltar (CEP geral de cidade fica sem rua mesmo).
	let result = primary;
	if (!result || !result.street || !result.neighborhood) {
		const fallback = await fetchViaCep(cep);
		if (fallback) {
			result = {
				street: result?.street || fallback.street,
				neighborhood: result?.neighborhood || fallback.neighborhood,
				city: result?.city || fallback.city,
				state: result?.state || fallback.state,
			};
		}
	}

	if (!result) {
		throw new LookupError("CEP não encontrado", 404);
	}
	if (!result.city && !result.street) {
		throw new LookupError("CEP não encontrado", 404);
	}
	return result;
}
