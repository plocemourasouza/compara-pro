import { describe, expect, it, vi } from "vitest";
import { filesFromDropEvent } from "./files-from-drop";

describe("filesFromDropEvent", () => {
	it("lê o arquivo solto sem chamar getFile", () => {
		const file = new File(["sku"], "lista.xlsx");
		const getFile = vi.fn();
		const files = filesFromDropEvent({
			dataTransfer: {
				files: [file],
				items: [{ kind: "file", getAsFile: () => file, getFile }],
			},
		});
		expect(files).toEqual([file]);
		expect(getFile).not.toHaveBeenCalled();
	});

	it("usa getAsFile quando a lista de arquivos vem vazia", () => {
		const file = new File(["sku"], "lista.csv");
		const files = filesFromDropEvent({
			dataTransfer: {
				files: [],
				items: [{ kind: "file", getAsFile: () => file }],
			},
		});
		expect(files).toEqual([file]);
	});

	it("lê a seleção do input de arquivo", () => {
		const file = new File(["sku"], "lista.xls");
		expect(
			filesFromDropEvent({ target: { type: "file", files: [file] } }),
		).toEqual([file]);
	});
});
