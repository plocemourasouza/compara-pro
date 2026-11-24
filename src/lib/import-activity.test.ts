import { describe, expect, it } from "vitest";
import {
	describeImportActivity,
	formatElapsed,
	pickTrackedUpload,
	type TrackedUpload,
} from "./import-activity";

const started = Date.parse("2026-11-24T12:00:00.000Z");

function upload(overrides: Partial<TrackedUpload> = {}): TrackedUpload {
	return {
		id: "up-1",
		fileName: "Atualizada.xls",
		status: "PROCESSING",
		totalRows: 2465,
		processedRows: 820,
		errorRows: 0,
		uploadedAt: "2026-11-24T12:00:02.000Z",
		...overrides,
	};
}

describe("pickTrackedUpload", () => {
	it("ignores an older upload of the same file", () => {
		const current = upload();
		const previous = upload({
			id: "up-old",
			uploadedAt: "2026-11-24T11:00:00.000Z",
		});
		expect(
			pickTrackedUpload([previous, current], "Atualizada.xls", started),
		).toEqual(current);
	});

	it("returns null until this attempt shows up", () => {
		expect(
			pickTrackedUpload(
				[upload({ fileName: "outra.xls" })],
				"Atualizada.xls",
				started,
			),
		).toBeNull();
	});
});

describe("describeImportActivity", () => {
	it("names the wait before the server has a row", () => {
		expect(describeImportActivity(null, 5)).toEqual({
			title: "Enviando o arquivo…",
			detail: "Aguardando o servidor confirmar o recebimento. 0:05",
			percent: null,
		});
	});

	it("reports how many products are already saved", () => {
		const activity = describeImportActivity(upload(), 75);
		expect(activity.title).toBe("Salvando produtos…");
		expect(activity.detail).toContain("820 de 2.465 produtos");
		expect(activity.detail).toContain("1:15");
		expect(activity.percent).toBe(33);
	});

	it("does not show 100% while the list is still finishing", () => {
		expect(
			describeImportActivity(
				upload({ processedRows: 2465, totalRows: 2465 }),
				90,
			).percent,
		).toBe(99);
	});
});

describe("formatElapsed", () => {
	it("pads the seconds", () => {
		expect(formatElapsed(65)).toBe("1:05");
	});
});
