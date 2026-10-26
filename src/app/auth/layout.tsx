import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/components/auth/auth-screen.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<main className={styles.screen}>
			<Image
				src="/auth/fundo-acesso.webp"
				alt=""
				fill
				priority
				sizes="100vw"
				className={styles.backdrop}
			/>
			<Link href="/" className={styles.brand} aria-label="Compara Pró, início">
				<svg viewBox="0 0 36 36" aria-hidden="true">
					<rect width="36" height="36" rx="8" fill="currentColor" />
					<path d="M9 23h4V13H9zm7 4h4V9h-4zm7-6h4v-8h-4z" fill="white" />
				</svg>
				compara <span>pró</span>
			</Link>
			<section className={styles.story} aria-labelledby="auth-story-title">
				<p className={styles.eyebrow}>Compras e representação comercial</p>
				<h2 id="auth-story-title">
					Quem compra decide.
					<br />
					Quem representa responde.
				</h2>
				<p className={styles.storyCopy}>
					Sua lista, os preços lado a lado e o próximo pedido no mesmo lugar.
				</p>
			</section>
			<div className={styles.formArea}>{children}</div>
			<footer className={styles.footer}>
				<span>Compara Pró · Comparação de preços no atacado</span>
				<span className={styles.imageNote}>
					Imagem ilustrativa gerada por IA
				</span>
			</footer>
		</main>
	);
}
