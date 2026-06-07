"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Transição suave (fade + slide) a cada navegação de rota. Envolve o conteúdo
 * de página dentro dos layouts. Respeita prefers-reduced-motion via framer.
 */
export function PageTransition({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	return (
		<AnimatePresence mode="wait" initial={false}>
			<motion.div
				key={pathname}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -8 }}
				transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}
