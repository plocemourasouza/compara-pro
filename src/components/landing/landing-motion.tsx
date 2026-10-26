"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

export function FadeIn({
	children,
	className,
	delay = 0,
}: {
	children: ReactNode;
	className?: string;
	delay?: number;
}) {
	const reduce = useReducedMotion();
	return (
		<motion.div
			className={className}
			initial={reduce ? false : { opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-10% 0px" }}
			transition={{ duration: 0.5, delay, ease }}
		>
			{children}
		</motion.div>
	);
}

export function HeroReveal({
	children,
	className,
	delay = 0,
}: {
	children: ReactNode;
	className?: string;
	delay?: number;
}) {
	const reduce = useReducedMotion();
	return (
		<motion.div
			className={className}
			initial={reduce ? false : { opacity: 0, y: 20, filter: "blur(6px)" }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			transition={{ duration: 0.65, delay, ease }}
		>
			{children}
		</motion.div>
	);
}
