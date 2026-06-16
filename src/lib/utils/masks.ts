// Utilitários para máscaras de input

export const masks = {
	cnpj: (value: string) => {
		const cleaned = value.replace(/\D/g, "");
		if (cleaned.length <= 14) {
			return cleaned
				.replace(/^(\d{2})(\d)/, "$1.$2")
				.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
				.replace(/\.(\d{3})(\d)/, ".$1/$2")
				.replace(/(\d{4})(\d)/, "$1-$2");
		}
		return value;
	},

	cep: (value: string) => {
		const cleaned = value.replace(/\D/g, "");
		if (cleaned.length <= 8) {
			return cleaned.replace(/^(\d{5})(\d)/, "$1-$2");
		}
		return value;
	},

	phone: (value: string) => {
		const cleaned = value.replace(/\D/g, "");
		if (cleaned.length <= 11) {
			if (cleaned.length <= 10) {
				return cleaned
					.replace(/^(\d{2})(\d)/, "($1) $2")
					.replace(/(\d{4})(\d)/, "$1-$2");
			}
			return cleaned
				.replace(/^(\d{2})(\d)/, "($1) $2")
				.replace(/(\d{5})(\d)/, "$1-$2");
		}
		return value;
	},

	// Máscara de moeda (BRL) digitada da direita p/ esquerda: "150" -> "1,50".
	currency: (value: string) => {
		const digits = value.replace(/\D/g, "");
		if (!digits) return "";
		const amount = Number.parseInt(digits, 10) / 100;
		return amount.toLocaleString("pt-BR", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	},

	/** Converte o valor mascarado de moeda ("1.234,56") para número (1234.56). */
	parseCurrency: (masked: string): number | undefined => {
		const digits = masked.replace(/\D/g, "");
		return digits ? Number.parseInt(digits, 10) / 100 : undefined;
	},

	removeNonDigits: (value: string) => {
		return value.replace(/\D/g, "");
	},

	onlyNumbers: (value: string) => {
		return value.replace(/[^0-9]/g, "");
	},

	onlyLetters: (value: string) => {
		return value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
	},

	capitalize: (value: string) => {
		return value
			.toLowerCase()
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	},
};

export const validations = {
	cnpj: (cnpj: string): boolean => {
		const cleaned = cnpj.replace(/\D/g, "");

		if (cleaned.length !== 14) return false;
		if (/^(\d)\1+$/.test(cleaned)) return false;

		let soma = 0;
		let peso = 5;

		// Primeiro dígito
		for (let i = 0; i < 12; i++) {
			soma += Number.parseInt(cleaned[i] ?? "0", 10) * peso;
			peso = peso === 2 ? 9 : peso - 1;
		}

		const digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
		if (Number.parseInt(cleaned[12] ?? "0", 10) !== digito1) return false;

		// Segundo dígito
		soma = 0;
		peso = 6;

		for (let i = 0; i < 13; i++) {
			soma += Number.parseInt(cleaned[i] ?? "0", 10) * peso;
			peso = peso === 2 ? 9 : peso - 1;
		}

		const digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);
		return Number.parseInt(cleaned[13] ?? "0", 10) === digito2;
	},

	cep: (cep: string): boolean => {
		const cleaned = cep.replace(/\D/g, "");
		return cleaned.length === 8;
	},

	phone: (phone: string): boolean => {
		const cleaned = phone.replace(/\D/g, "");
		return cleaned.length >= 10 && cleaned.length <= 11;
	},

	email: (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	},
};

export const formatters = {
	cnpj: (cnpj: string) => {
		const cleaned = cnpj.replace(/\D/g, "");
		return cleaned.replace(
			/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
			"$1.$2.$3/$4-$5",
		);
	},

	// Anonimização LGPD: exibe só a raiz parcial (5 primeiros dígitos),
	// ocultando filial e dígitos verificadores. Ex.: "12.345.***/****-**".
	maskCnpj: (cnpj: string) => {
		const cleaned = cnpj.replace(/\D/g, "");
		if (cleaned.length !== 14) return "***";
		return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.***/****-**`;
	},

	// Anonimização null-safe para uso no payload das APIs: passa null/vazio
	// adiante (campo opcional) e mascara qualquer valor presente. Mantém o CNPJ
	// cru fora da resposta sem espalhar o ternário pelos route handlers.
	redactCnpj: (cnpj: string | null | undefined): string | null =>
		cnpj ? formatters.maskCnpj(cnpj) : null,

	cep: (cep: string) => {
		const cleaned = cep.replace(/\D/g, "");
		return cleaned.replace(/^(\d{5})(\d{3})$/, "$1-$2");
	},

	phone: (phone: string) => {
		const cleaned = phone.replace(/\D/g, "");
		if (cleaned.length === 11) {
			return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
		}
		if (cleaned.length === 10) {
			return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
		}
		return phone;
	},

	currency: (value: number) => {
		return new Intl.NumberFormat("pt-BR", {
			style: "currency",
			currency: "BRL",
		}).format(value);
	},

	date: (date: string | Date) => {
		return new Date(date).toLocaleDateString("pt-BR");
	},

	datetime: (date: string | Date) => {
		return new Date(date).toLocaleString("pt-BR");
	},
};
