type DropLike = {
	dataTransfer?: {
		files?: ArrayLike<File> | null;
		items?: ArrayLike<{ kind?: string; getAsFile?: () => File | null }> | null;
	} | null;
	target?: { type?: string; files?: ArrayLike<File> | null } | null;
};

function asFiles(list: ArrayLike<File> | null | undefined): File[] {
	if (!list || list.length === 0) return [];
	return Array.from(list);
}

/**
 * Reads files from a drop or a file input without the File System Access API.
 * `FileSystemFileHandle.getFile()` throws NotAllowedError in embedded browsers
 * (the Next.js overlay then reports it as a console error).
 */
export function filesFromDropEvent(event: unknown): File[] {
	if (!event || typeof event !== "object") return [];
	const candidate = event as DropLike;
	if (candidate.target?.type === "file") {
		return asFiles(candidate.target.files);
	}
	const transfer = candidate.dataTransfer;
	const listed = asFiles(transfer?.files);
	if (listed.length > 0) return listed;
	if (!transfer?.items) return [];
	const fromItems: File[] = [];
	for (const item of Array.from(transfer.items)) {
		if (item.kind !== "file" || !item.getAsFile) continue;
		const file = item.getAsFile();
		if (file) fromItems.push(file);
	}
	return fromItems;
}
