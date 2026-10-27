import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "@/components/auth/auth-screen.module.css";
import { BrandMark } from "@/components/shared/brand-mark";

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
				<BrandMark symbolOnly size={34} />
				Compara <span>PRÓ</span>
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
				<span>
					© {new Date().getFullYear()} Compara Pró · Comparação de preços no
					atacado
				</span>
				<span className={styles.credit}>
					Desenvolvido&nbsp;por&nbsp;
					<a
						href="https://osystems.com.br"
						target="_blank"
						rel="noreferrer noopener"
					>
						oSystems
					</a>
				</span>
			</footer>
		</main>
	);
}
