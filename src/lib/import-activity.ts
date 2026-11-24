export type TrackedUpload = {
	id: string;
	fileName: string;
	status: string;
	totalRows: number;
	processedRows: number;
	errorRows: number;
	uploadedAt: string;
};

export type ImportActivity = {
	title: string;
	detail: string;
	/** null = the server has not reported a row count yet. */
	percent: number | null;
};

const pt = (value: number) => value.toLocaleString("pt-BR");

export function formatElapsed(seconds: number): string {
	const safe = Math.max(0, Math.floor(seconds));
	const minutes = Math.floor(safe / 60);
	const rest = safe % 60;
	return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

/** Newest upload of this file that started with the current attempt. */
export function pickTrackedUpload(
	uploads: TrackedUpload[],
	fileName: string,
	startedAtMs: number,
): TrackedUpload | null {
	const floor = startedAtMs - 15_000;
	let best: TrackedUpload | null = null;
	let bestAt = Number.NEGATIVE_INFINITY;
	for (const upload of uploads) {
		if (upload.fileName !== fileName) continue;
		const at = new Date(upload.uploadedAt).getTime();
		if (Number.isNaN(at) || at < floor || at < bestAt) continue;
		best = upload;
		bestAt = at;
	}
	return best;
}

export function describeImportActivity(
	upload: TrackedUpload | null,
	elapsedSec: number,
): ImportActivity {
	const clock = formatElapsed(elapsedSec);
	if (!upload) {
		return {
			title: "Enviando o arquivo…",
			detail: `Aguardando o servidor confirmar o recebimento. ${clock}`,
			percent: null,
		};
	}
	if (upload.status === "FAILED") {
		return {
			title: "A lista não pôde ser salva",
			detail: clock,
			percent: null,
		};
	}
	if (upload.status === "COMPLETED") {
		return {
			title: "Lista salva",
			detail: `${pt(upload.processedRows)} produtos processados. ${clock}`,
			percent: 100,
		};
	}
	if (upload.totalRows <= 0) {
		return {
			title: "Lendo a planilha…",
			detail: `O arquivo chegou. Contando as linhas. ${clock}`,
			percent: null,
		};
	}
	if (upload.processedRows <= 0) {
		return {
			title: "Preparando o catálogo…",
			detail: `${pt(upload.totalRows)} produtos na lista. ${clock}`,
			percent: 0,
		};
	}
	if (upload.processedRows >= upload.totalRows) {
		return {
			title: "Finalizando a lista…",
			detail: `Os ${pt(upload.totalRows)} produtos já foram salvos. ${clock}`,
			percent: 99,
		};
	}
	const percent = Math.min(
		99,
		Math.round((upload.processedRows / upload.totalRows) * 100),
	);
	return {
		title: "Salvando produtos…",
		detail: `${pt(upload.processedRows)} de ${pt(upload.totalRows)} produtos. Mantenha esta janela aberta. ${clock}`,
		percent,
	};
}
