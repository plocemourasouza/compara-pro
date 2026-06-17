import { masks } from "@/lib/utils/masks";

/** Mantém só dígitos; "" → null; undefined/null preservados (não sobrescreve em update parcial). */
const digits = (v?: string | null): string | null | undefined =>
	v == null ? v : masks.removeNonDigits(v) || null;

/** trim + lowercase; "" → null; undefined/null preservados. */
const email = (v?: string | null): string | null | undefined =>
	v == null ? v : v.trim().toLowerCase() || null;

type CompanyLike = {
	cnpj?: string | null;
	zipCode?: string | null;
	phone?: string | null;
	responsiblePhone?: string | null;
	email?: string | null;
	responsibleEmail?: string | null;
};

/**
 * Canonicaliza campos estruturados antes de persistir: documentos/telefones/CEP
 * viram só dígitos; e-mails viram trim+lowercase. Exibição reformata via formatters.
 */
export function normalizeCompanyData<T extends CompanyLike>(data: T): T {
	return {
		...data,
		cnpj: digits(data.cnpj),
		zipCode: digits(data.zipCode),
		phone: digits(data.phone),
		responsiblePhone: digits(data.responsiblePhone),
		email: email(data.email),
		responsibleEmail: email(data.responsibleEmail),
	};
}

type UserLike = { phone?: string | null; email?: string | null };

export function normalizeUserData<T extends UserLike>(data: T): T {
	return {
		...data,
		phone: digits(data.phone),
		email: email(data.email),
	};
}
