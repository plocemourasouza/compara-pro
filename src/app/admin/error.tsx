"use client";

import { AreaError } from "@/components/shared/area-error";

// App Router exige export default em error.tsx.
export default function AdminError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return <AreaError error={error} reset={reset} homeHref="/admin" />;
}
