import { describe, expect, it } from "vitest";
import { storedUploadErrors } from "./upload-row-error";

describe("storedUploadErrors", () => {
	it("lê o campo e a mensagem gravados no envio", () => {
		expect(
			storedUploadErrors([
				{
					row: 14,
					field: "Nome",
					message: "Campo obrigatório ausente: Nome",
					value: "",
				},
				{
					row: 2,
					field: "Preço",
					message: "Valor inválido no campo Preço",
					value: "0",
				},
			]),
		).toEqual([
			{
				row: 14,
				field: "Nome",
				message: "Campo obrigatório ausente: Nome",
				value: "",
			},
			{
				row: 2,
				field: "Preço",
				message: "Valor inválido no campo Preço",
				value: "0",
			},
		]);
	});

	it("ignora um valor que não é lista de erros", () => {
		expect(storedUploadErrors(null)).toEqual([]);
		expect(storedUploadErrors({ row: 1 })).toEqual([]);
	});
});
