"use client";

import { useEffect, useState } from "react";

interface HydrationFixProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export default function HydrationFix({
	children,
	fallback = null,
}: HydrationFixProps) {
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	// Durante a renderização no servidor e inicial do cliente
	if (!mounted) {
		return <>{fallback}</>;
	}

	// Após a hidratação
	return <>{children}</>;
}
