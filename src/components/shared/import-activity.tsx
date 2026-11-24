"use client";

import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import {
	describeImportActivity,
	pickTrackedUpload,
	type TrackedUpload,
} from "@/lib/import-activity";

type WatchTarget = {
	fileName: string;
	companyId?: string;
	uploadType: string;
};

export function useLiveUpload(active: boolean, target: WatchTarget | null) {
	const [tracked, setTracked] = useState<TrackedUpload | null>(null);
	const [elapsedSec, setElapsedSec] = useState(0);
	const startedRef = useRef(0);
	const fileName = target?.fileName ?? null;
	const companyId = target?.companyId ?? null;
	const uploadType = target?.uploadType ?? null;

	useEffect(() => {
		if (!active || !fileName || !uploadType) {
			setTracked(null);
			setElapsedSec(0);
			return;
		}
		startedRef.current = Date.now();
		setTracked(null);
		setElapsedSec(0);
		let cancelled = false;

		const clock = setInterval(() => {
			setElapsedSec(Math.floor((Date.now() - startedRef.current) / 1000));
		}, 1000);

		const poll = async () => {
			const params = new URLSearchParams({
				type: uploadType,
				limit: "5",
			});
			if (companyId) params.set("companyId", companyId);
			try {
				const response = await fetch(`/api/upload/history?${params}`);
				if (!response.ok) return;
				const body: unknown = await response.json();
				const uploads = readUploads(body);
				const match = pickTrackedUpload(uploads, fileName, startedRef.current);
				if (!cancelled && match) setTracked(match);
			} catch {
				// The clock keeps moving. The next poll retries.
			}
		};

		void poll();
		const timer = setInterval(() => void poll(), 2000);
		return () => {
			cancelled = true;
			clearInterval(clock);
			clearInterval(timer);
		};
	}, [active, fileName, companyId, uploadType]);

	return { tracked, elapsedSec };
}

function readUploads(body: unknown): TrackedUpload[] {
	if (!body || typeof body !== "object" || !("uploads" in body)) return [];
	const uploads = (body as { uploads: unknown }).uploads;
	if (!Array.isArray(uploads)) return [];
	return uploads.flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const row = item as Record<string, unknown>;
		if (typeof row.id !== "string" || typeof row.fileName !== "string") {
			return [];
		}
		return [
			{
				id: row.id,
				fileName: row.fileName,
				status: typeof row.status === "string" ? row.status : "",
				totalRows: numberOf(row.totalRows),
				processedRows: numberOf(row.processedRows),
				errorRows: numberOf(row.errorRows),
				uploadedAt: typeof row.uploadedAt === "string" ? row.uploadedAt : "",
			},
		];
	});
}

function numberOf(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function ImportActivity({
	tracked,
	elapsedSec,
	holding,
}: {
	tracked: TrackedUpload | null;
	elapsedSec: number;
	/** The HTTP response already failed; the catalog write may still be running. */
	holding: boolean;
}) {
	const activity = describeImportActivity(tracked, elapsedSec);
	return (
		<div className="space-y-2" aria-live="polite">
			<div className="flex justify-between gap-3 text-sm">
				<span>{activity.title}</span>
				{activity.percent != null && <span>{activity.percent}%</span>}
			</div>
			<Progress value={activity.percent ?? undefined} />
			<p className="text-sm text-muted-foreground">{activity.detail}</p>
			{holding && (
				<p className="text-sm text-muted-foreground">
					A resposta do servidor demorou, e a gravação continua. Não feche esta
					janela.
				</p>
			)}
		</div>
	);
}
