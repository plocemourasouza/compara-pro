import type { ReactNode } from "react";
import styles from "./auth-screen.module.css";

export function AuthPanel({
	eyebrow,
	title,
	description,
	compact = false,
	children,
}: {
	eyebrow: string;
	title: string;
	description: string;
	compact?: boolean;
	children: ReactNode;
}) {
	return (
		<section
			className={`${styles.panel} ${compact ? styles.compact : ""}`}
			aria-labelledby="auth-title"
		>
			<header>
				<p className={styles.overline}>{eyebrow}</p>
				<h1 id="auth-title">{title}</h1>
				<p className={styles.subtitle}>{description}</p>
			</header>
			{children}
		</section>
	);
}

export function AuthFormLoading() {
	return (
		<div className={styles.loading} role="status">
			Carregando formulário…
		</div>
	);
}
