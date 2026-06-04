export interface TimedResponse {
	ok: boolean;
	status: number;
	json: unknown;
}

/** fetch + JSON parse with an abort timeout. Never throws — returns status 0 on failure. */
export async function timedFetch(
	url: string,
	init: RequestInit,
	timeoutMs: number,
): Promise<TimedResponse> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, { ...init, signal: controller.signal });
		const json: unknown = await res.json().catch(() => null);
		return { ok: res.ok, status: res.status, json };
	} catch {
		return { ok: false, status: 0, json: null };
	} finally {
		clearTimeout(timer);
	}
}
