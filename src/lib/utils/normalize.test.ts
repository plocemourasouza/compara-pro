import { describe, expect, it } from "vitest";
import { normalizeCompanyData, normalizeUserData } from "./normalize";

describe("normalizeCompanyData", () => {
	describe("campos de dígitos (cnpj, zipCode, phone, etc)", () => {
		describe("tri-estado: undefined, null, string", () => {
			it("undefined → undefined (não sobrescreve em update parcial)", () => {
				const data = { cnpj: undefined };
				const result = normalizeCompanyData(data);

				expect(result.cnpj).toBeUndefined();
				expect(Object.hasOwn(result, "cnpj")).toBe(true);
			});

			it("null → null (preservado)", () => {
				const data = { cnpj: null };
				const result = normalizeCompanyData(data);

				expect(result.cnpj).toBeNull();
			});

			it('string vazia "" → null (canonicalizado)', () => {
				const data = { cnpj: "" };
				const result = normalizeCompanyData(data);

				expect(result.cnpj).toBeNull();
			});

			it("whitespace-only → null", () => {
				const data = { cnpj: "   " };
				const result = normalizeCompanyData(data);

				expect(result.cnpj).toBeNull();
			});
		});

		describe("remoção de formatação (dígitos)", () => {
			it("CNPJ formatado → só dígitos", () => {
				const data = { cnpj: "12.345.678/0001-90" };
				const result = normalizeCompanyData(data);

				expect(result.cnpj).toBe("12345678000190");
			});

			it("CEP formatado → só dígitos", () => {
				const data = { zipCode: "12345-678" };
				const result = normalizeCompanyData(data);

				expect(result.zipCode).toBe("12345678");
			});

			it("telefone com formatação → só dígitos", () => {
				const data = { phone: "(11) 98765-4321" };
				const result = normalizeCompanyData(data);

				expect(result.phone).toBe("11987654321");
			});

			it("responsiblePhone com formatação → só dígitos", () => {
				const data = { responsiblePhone: "(11) 99999-9999" };
				const result = normalizeCompanyData(data);

				expect(result.responsiblePhone).toBe("11999999999");
			});

			it("lixo (não-dígitos) → null", () => {
				const data = { cnpj: "abc-def" };
				const result = normalizeCompanyData(data);

				expect(result.cnpj).toBeNull();
			});
		});
	});

	describe("campos de e-mail", () => {
		describe("tri-estado: undefined, null, string", () => {
			it("undefined → undefined (não sobrescreve)", () => {
				const data = { email: undefined };
				const result = normalizeCompanyData(data);

				expect(result.email).toBeUndefined();
				expect(Object.hasOwn(result, "email")).toBe(true);
			});

			it("null → null (preservado)", () => {
				const data = { email: null };
				const result = normalizeCompanyData(data);

				expect(result.email).toBeNull();
			});

			it('string vazia "" → null', () => {
				const data = { email: "" };
				const result = normalizeCompanyData(data);

				expect(result.email).toBeNull();
			});

			it("whitespace-only → null (trim primeiro)", () => {
				const data = { email: "   " };
				const result = normalizeCompanyData(data);

				expect(result.email).toBeNull();
			});
		});

		describe("transformação e-mail", () => {
			it("trim + lowercase", () => {
				const data = { email: "  Foo@BAR.com  " };
				const result = normalizeCompanyData(data);

				expect(result.email).toBe("foo@bar.com");
			});

			it("múltiplos espaços", () => {
				const data = { email: "   TEST@EXAMPLE.COM   " };
				const result = normalizeCompanyData(data);

				expect(result.email).toBe("test@example.com");
			});

			it("responsibleEmail também transformado", () => {
				const data = { responsibleEmail: "  ADMIN@COMPANY.BR  " };
				const result = normalizeCompanyData(data);

				expect(result.responsibleEmail).toBe("admin@company.br");
			});
		});
	});

	describe("propagação de campos não-normalizados", () => {
		it("campos arbitrários passam intactos", () => {
			const data = {
				name: "Empresa XYZ",
				type: "SUPPLIER",
				cnpj: "12.345.678/0001-90",
			};
			const result = normalizeCompanyData(data);

			expect(result.name).toBe("Empresa XYZ");
			expect(result.type).toBe("SUPPLIER");
		});

		it("mistura de campos normalizados e não-normalizados", () => {
			const data = {
				name: "ACME Corp",
				cnpj: "11.222.333/0001-81",
				email: "  INFO@ACME.COM  ",
				website: "https://acme.com",
			};
			const result = normalizeCompanyData(data);

			expect(result.name).toBe("ACME Corp");
			expect(result.cnpj).toBe("11222333000181");
			expect(result.email).toBe("info@acme.com");
			expect(result.website).toBe("https://acme.com");
		});
	});

	describe("múltiplos campos simultaneamente", () => {
		it("companyData completo", () => {
			const data = {
				cnpj: "12.345.678/0001-90",
				zipCode: "12345-678",
				phone: "(11) 98765-4321",
				responsiblePhone: "(11) 99999-9999",
				email: "  CONTACT@COMPANY.BR  ",
				responsibleEmail: "  ADMIN@COMPANY.BR  ",
			};
			const result = normalizeCompanyData(data);

			expect(result.cnpj).toBe("12345678000190");
			expect(result.zipCode).toBe("12345678");
			expect(result.phone).toBe("11987654321");
			expect(result.responsiblePhone).toBe("11999999999");
			expect(result.email).toBe("contact@company.br");
			expect(result.responsibleEmail).toBe("admin@company.br");
		});

		it("mistura de valores válidos e null", () => {
			const data = {
				cnpj: "12.345.678/0001-90",
				phone: null,
				email: "  VALID@EMAIL.COM  ",
				responsibleEmail: null,
				zipCode: undefined,
			};
			const result = normalizeCompanyData(data);

			expect(result.cnpj).toBe("12345678000190");
			expect(result.phone).toBeNull();
			expect(result.email).toBe("valid@email.com");
			expect(result.responsibleEmail).toBeNull();
			expect(result.zipCode).toBeUndefined();
		});
	});
});

describe("normalizeUserData", () => {
	describe("campos normalizados: phone e email", () => {
		describe("phone: tri-estado", () => {
			it("undefined → undefined", () => {
				const data = { phone: undefined };
				const result = normalizeUserData(data);

				expect(result.phone).toBeUndefined();
				expect(Object.hasOwn(result, "phone")).toBe(true);
			});

			it("null → null", () => {
				const data = { phone: null };
				const result = normalizeUserData(data);

				expect(result.phone).toBeNull();
			});

			it('string vazia "" → null', () => {
				const data = { phone: "" };
				const result = normalizeUserData(data);

				expect(result.phone).toBeNull();
			});

			it("telefone com formatação → só dígitos", () => {
				const data = { phone: "(11) 98765-4321" };
				const result = normalizeUserData(data);

				expect(result.phone).toBe("11987654321");
			});
		});

		describe("email: tri-estado", () => {
			it("undefined → undefined", () => {
				const data = { email: undefined };
				const result = normalizeUserData(data);

				expect(result.email).toBeUndefined();
				expect(Object.hasOwn(result, "email")).toBe(true);
			});

			it("null → null", () => {
				const data = { email: null };
				const result = normalizeUserData(data);

				expect(result.email).toBeNull();
			});

			it('string vazia "" → null', () => {
				const data = { email: "" };
				const result = normalizeUserData(data);

				expect(result.email).toBeNull();
			});

			it("trim + lowercase", () => {
				const data = { email: "  User@EXAMPLE.COM  " };
				const result = normalizeUserData(data);

				expect(result.email).toBe("user@example.com");
			});

			it("whitespace-only → null", () => {
				const data = { email: "   " };
				const result = normalizeUserData(data);

				expect(result.email).toBeNull();
			});
		});
	});

	describe("campos não-normalizados (passam intactos)", () => {
		it("campo name não é tocado", () => {
			const data = {
				name: "João Silva",
				email: "  JOAO@EXAMPLE.COM  ",
				phone: "(11) 98765-4321",
			};
			const result = normalizeUserData(data);

			expect(result.name).toBe("João Silva");
			expect(result.email).toBe("joao@example.com");
			expect(result.phone).toBe("11987654321");
		});

		it("campos arbitrários passam intactos", () => {
			const data = {
				role: "ADMIN",
				status: "active",
				companyId: "co-123",
				email: "  test@example.com  ",
			};
			const result = normalizeUserData(data);

			expect(result.role).toBe("ADMIN");
			expect(result.status).toBe("active");
			expect(result.companyId).toBe("co-123");
			expect(result.email).toBe("test@example.com");
		});
	});

	describe("composição: phone + email simultaneamente", () => {
		it("ambos normalizados", () => {
			const data = {
				phone: "(11) 98765-4321",
				email: "  USER@COMPANY.BR  ",
			};
			const result = normalizeUserData(data);

			expect(result.phone).toBe("11987654321");
			expect(result.email).toBe("user@company.br");
		});

		it("mistura de valores válidos e null", () => {
			const data = {
				phone: null,
				email: "  VALID@EMAIL.COM  ",
			};
			const result = normalizeUserData(data);

			expect(result.phone).toBeNull();
			expect(result.email).toBe("valid@email.com");
		});

		it("mistura de valores válidos e undefined", () => {
			const data = {
				phone: "(11) 91234-5678",
				email: undefined,
			};
			const result = normalizeUserData(data);

			expect(result.phone).toBe("11912345678");
			expect(result.email).toBeUndefined();
			expect(Object.hasOwn(result, "email")).toBe(true);
		});
	});
});
