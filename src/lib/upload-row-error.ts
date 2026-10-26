import { ZodError } from "zod";

const FIELD_LABELS: Record<string, string> = {
	name: "Nome",
	sku: "SKU",
	code: "Código",
	price: "Preço",
	category: "Categoria",
	unit: "Unidade",
	description: "Descrição",
	targetPrice: "Preço alvo",
	quantity: "Quantidade",
};

const REQUIRED_FIELDS = new Set(["name"]);

export type StoredUploadError = {
	row: number;
	field?: string;
	message: string;
	value?: string;
};

type IssueText = {
	field: string;
	required: boolean;
	text: string;
};

function issueText(key: string, code: string): IssueText | null {
	const field = FIELD_LABELS[key];
	if (!field) return null;
	if (
		REQUIRED_FIELDS.has(key) &&
		(code === "invalid_type" || code === "too_small")
	) {
		return {
			field,
			required: true,
			text: `Campo obrigatório ausente: ${field}`,
		};
	}
	return { field, required: false, text: `Valor inválido no campo ${field}` };
}

function cellText(value: unknown): string {
	if (value == null) return "";
	return String(value).trim();
}

function currentValue(
	source: Record<string, unknown> | undefined,
	keys: string[],
): string {
	if (!source || keys.length === 0) return "";
	if (keys.length === 1) return cellText(source[keys[0] ?? ""]);
	return keys
		.map((key) => {
			const text = cellText(source[key]);
			return `${FIELD_LABELS[key] ?? key}: ${text || "—"}`;
		})
		.join(" · ");
}

/** Turns a Zod (or other) row failure into a Portuguese message that names the field. */
export function describeRowError(
	error: unknown,
	source?: Record<string, unknown>,
): {
	field?: string;
	message: string;
	value?: string;
} {
	if (error instanceof ZodError) {
		const parts = error.issues.flatMap((issue) => {
			const key = String(issue.path[0] ?? "");
			const text = issueText(key, issue.code);
			return text ? [{ ...text, key }] : [];
		});
		if (parts.length === 0) return { message: "Linha inválida" };
		const required = parts.filter((part) => part.required);
		const invalid = parts.filter((part) => !part.required);
		const sentences: string[] = [];
		if (required.length === 1) {
			sentences.push(required[0]?.text ?? "");
		} else if (required.length > 1) {
			sentences.push(
				`Campos obrigatórios ausentes: ${required.map((part) => part.field).join(", ")}`,
			);
		}
		for (const part of invalid) sentences.push(part.text);
		return {
			field: parts.map((part) => part.field).join(", "),
			message: sentences.filter(Boolean).join(". "),
			value: currentValue(
				source,
				parts.map((part) => part.key),
			),
		};
	}
	if (error instanceof Error && error.message) {
		return { message: error.message };
	}
	return { message: "Erro de validação" };
}

export function storedUploadErrors(value: unknown): StoredUploadError[] {
	if (!Array.isArray(value)) return [];
	const errors: StoredUploadError[] = [];
	for (const item of value) {
		if (!item || typeof item !== "object") continue;
		const row = (item as { row?: unknown }).row;
		const message = (item as { message?: unknown }).message;
		const field = (item as { field?: unknown }).field;
		const value = (item as { value?: unknown }).value;
		if (typeof row !== "number" || typeof message !== "string") continue;
		errors.push({
			row,
			message,
			...(typeof field === "string" && field.length > 0 ? { field } : {}),
			...(typeof value === "string" ? { value } : {}),
		});
	}
	return errors;
}
