import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/shared/brand-mark";
import { ComparisonDesk } from "./comparison-desk";
import "./landing.css";

export function LandingPage() {
	return (
		<div id="top" className="compara-landing">
			<svg
				aria-hidden="true"
				width="0"
				height="0"
				style={{ position: "absolute" }}
			>
				<defs>
					<symbol id="cp-arrow" viewBox="0 0 24 24">
						<path d="M5 12h14m-6-6 6 6-6 6"></path>
					</symbol>
					<symbol id="cp-file" viewBox="0 0 24 24">
						<path d="M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9l-6-6Z"></path>
						<path d="M13 3v6h6M9 13h6m-6 4h6"></path>
					</symbol>
					<symbol id="cp-compare" viewBox="0 0 24 24">
						<path d="M4 4h16v16H4zM4 10h16M10 4v16m4-10v10"></path>
					</symbol>
					<symbol id="cp-checklist" viewBox="0 0 24 24">
						<path d="M9 5h11M9 12h11M9 19h11M3 5l1 1 2-3m-3 9 1 1 2-3m-3 9 1 1 2-3"></path>
					</symbol>
					<symbol id="cp-person" viewBox="0 0 24 24">
						<circle cx="12" cy="7" r="4"></circle>
						<path d="M4 21v-2a8 8 0 0 1 16 0v2"></path>
					</symbol>
					<symbol id="cp-case" viewBox="0 0 24 24">
						<path d="M9 6V3h6v3M3 6h18v14H3zM3 11a20 20 0 0 0 18 0M10 12v3h4v-3"></path>
					</symbol>
					<symbol id="cp-admin" viewBox="0 0 24 24">
						<path d="m12 3 8 4v5c0 4-4 7-8 9-4-2-8-5-8-9V7l8-4Z"></path>
						<path d="m8 12 3 3 5-6"></path>
					</symbol>
					<symbol id="cp-search-icon" viewBox="0 0 24 24">
						<circle cx="10.5" cy="10.5" r="6.5"></circle>
						<path d="m16 16 5 5"></path>
					</symbol>
					<symbol id="cp-login" viewBox="0 0 24 24">
						<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
						<path d="m10 17 5-5-5-5"></path>
						<path d="M15 12H3"></path>
					</symbol>
					<symbol id="cp-whatsapp" viewBox="0 0 24 24">
						<path d="M12.04 2.04A9.94 9.94 0 0 0 2.1 12a9.9 9.9 0 0 0 1.4 5.1L2 22l4.98-1.3A9.96 9.96 0 1 0 12.04 2.04Zm0 1.82a8.12 8.12 0 0 1 8.14 8.14 8.12 8.12 0 0 1-8.14 8.14 8.08 8.08 0 0 1-3.9-1l-.28-.16-2.96.78.79-2.88-.18-.3a8.1 8.1 0 0 1-1.47-4.58 8.12 8.12 0 0 1 8-8.14Zm4.7 11.66c-.2-.1-1.2-.59-1.38-.66-.19-.07-.32-.1-.46.1-.14.2-.53.66-.65.8-.12.13-.24.15-.44.05-.2-.1-.85-.31-1.62-.99a6.05 6.05 0 0 1-1.12-1.4c-.12-.2-.01-.3.09-.4.09-.1.2-.24.3-.36.1-.12.13-.2.2-.34.07-.13.03-.25-.02-.35-.05-.1-.46-1.1-.63-1.5-.17-.4-.34-.34-.46-.34h-.4c-.14 0-.36.05-.55.26-.19.2-.72.7-.72 1.72s.74 2 0.84 2.14c.1.14 1.45 2.21 3.5 3.1 1.34.58 1.62.46 1.91.44.29-.02.97-.4 1.1-.78.14-.39.14-.72.1-.79-.04-.06-.18-.1-.38-.2Z"></path>
					</symbol>
				</defs>
			</svg>
			<a className="skip" href="#conteudo">
				Pular para o conteúdo
			</a>
			<header className="topbar">
				<nav className="wrap nav" aria-label="Navegação principal">
					<a className="brand" href="#top" aria-label="Compara Pró, início">
						<BrandMark symbolOnly size={33} />
						Compara <span>PRÓ</span>
					</a>
					<div className="nav-links">
						<a href="#como-funciona">Como funciona</a>
						<a href="#para-quem">Para quem é</a>
						<a href="#duvidas">Dúvidas</a>
					</div>
					<div className="nav-doors">
						<Link className="button small outline" href="/auth/login">
							<svg className="icon" aria-hidden="true">
								<use href="#cp-login"></use>
							</svg>
							Entrar
						</Link>
					</div>
				</nav>
			</header>
			<main id="conteudo">
				<section className="hero wrap reveal" aria-labelledby="hero-title">
					<div className="hero-content">
						<div className="eyebrow">
							<span className="dot"></span> COMPARAÇÃO DE PREÇOS NO ATACADO
						</div>
						<h1 id="hero-title">
							Compare preços.
							<br /> Decida item
							<br /> <em>por item.</em>
						</h1>
						<p className="hero-copy">
							Envie sua lista em Excel ou CSV. Compare os preços dos
							fornecedores da sua carteira, escolha a oferta de cada item e gere
							o pedido. O representante recebe e aprova ou rejeita.
						</p>
						<div className="hero-doors">
							<Link className="button" href="/auth/login">
								Começar agora{" "}
								<svg className="arrow" aria-hidden="true">
									<use href="#cp-arrow"></use>
								</svg>
							</Link>
						</div>
						<a href="#comparacao" className="hero-foot">
							<svg className="icon" aria-hidden="true">
								<use href="#cp-compare"></use>
							</svg>{" "}
							Veja a comparação na prática. <span aria-hidden="true">↓</span>
						</a>
					</div>
					<figure className="hero-visual">
						<Image
							src="/landing/representacao-comercial.webp"
							width={1400}
							height={933}
							alt="Representante comercial e lojista conferem uma lista de compra em um ponto de venda. Cena ilustrativa."
							sizes="(max-width: 760px) 100vw, 50vw"
							preload
						/>
						<figcaption>
							<span className="photo-kicker">
								COMPRA E VENDA NO MESMO FLUXO.
							</span>
							<strong>
								Quem compra decide.
								<br />
								Quem representa responde.
							</strong>
						</figcaption>
						<span className="photo-corner" aria-hidden="true">
							↗
						</span>
					</figure>
				</section>
				<ComparisonDesk></ComparisonDesk>
				<section className="flow" id="como-funciona">
					<div className="wrap">
						<div className="section-heading">
							<div>
								<div className="kicker">COMO FUNCIONA</div>
								<h2>
									Da sua lista de compras
									<br />
									ao pedido.
								</h2>
							</div>
							<p>
								Da lista real à resposta do representante, cada etapa mantém a
								compra ligada à sua carteira de fornecedores.
							</p>
						</div>
						<div className="steps">
							<article className="step">
								<div className="step-meta">
									<span className="step-number">01 /</span>
									<svg className="icon" aria-hidden="true">
										<use href="#cp-file"></use>
									</svg>
								</div>
								<h3>Envie sua lista real.</h3>
								<p>
									Envie sua lista em Excel ou CSV. Se precisar, baixe o template
									para preparar o arquivo no formato da plataforma.
								</p>
								<span className="step-tag">Excel ou CSV</span>
							</article>
							<article className="step">
								<div className="step-meta">
									<span className="step-number">02 /</span>
									<svg className="icon" aria-hidden="true">
										<use href="#cp-compare"></use>
									</svg>
								</div>
								<h3>Compare os fornecedores.</h3>
								<p>
									A plataforma cruza os itens com os catálogos dos fornecedores
									da sua carteira. Confira as correspondências, ajuste quando
									necessário e escolha a oferta de cada linha.
								</p>
								<span className="step-tag">Preços comparados por item</span>
							</article>
							<article className="step">
								<div className="step-meta">
									<span className="step-number">03 /</span>
									<svg className="icon" aria-hidden="true">
										<use href="#cp-checklist"></use>
									</svg>
								</div>
								<h3>Prepare o pedido.</h3>
								<p>
									Gere um ou mais pedidos com as ofertas selecionadas. O
									representante recebe cada pedido e aprova ou rejeita.
								</p>
								<span className="step-tag">Resposta do representante</span>
							</article>
						</div>
						<p className="handoff">
							<strong>
								A comparação vira pedido. O representante dá a resposta.
							</strong>
							<br />O comprador acompanha o que está pendente, aprovado,
							rejeitado ou expirado.
						</p>
					</div>
				</section>
				<section className="workplace" id="para-quem">
					<div className="wrap">
						<div className="workplace-intro">
							<figure className="workplace-photo">
								<Image
									src="/landing/compra-no-atacado.webp"
									width={1400}
									height={788}
									loading="lazy"
									decoding="async"
									alt="Profissionais de compras e representação conferem um pedido em um estoque de distribuidora. Cena ilustrativa."
									sizes="(max-width: 760px) 100vw, 50vw"
								/>
								<figcaption>
									A lista orienta a compra. O representante responde.
								</figcaption>
							</figure>
							<div className="workplace-head">
								<div>
									<div className="kicker">
										PARA COMPRADORES E REPRESENTANTES
									</div>
									<h2>
										Uma plataforma.
										<br />
										Dois lados da
										<br /> mesma negociação.
									</h2>
								</div>
								<p>
									O comprador compara os fornecedores da sua carteira. O
									representante publica os catálogos e responde aos pedidos.
								</p>
							</div>
						</div>
						<div className="roles">
							<article className="role">
								<div className="role-top">
									<span className="label">PARA O COMPRADOR</span>
									<svg className="icon" aria-hidden="true">
										<use href="#cp-person"></use>
									</svg>
								</div>
								<h3>Compare os preços da sua próxima compra.</h3>
								<p>
									Envie a lista, veja quem oferece o menor preço de cada item e
									gere o pedido sem montar a comparação em uma planilha manual.
								</p>
								<Link className="role-link" href="/auth/register">
									Criar conta de comprador{" "}
									<svg className="arrow" aria-hidden="true">
										<use href="#cp-arrow"></use>
									</svg>
								</Link>
							</article>
							<article className="role">
								<div className="role-top">
									<span className="label">PARA O REPRESENTANTE</span>
									<svg className="icon" aria-hidden="true">
										<use href="#cp-case"></use>
									</svg>
								</div>
								<h3>Organize sua rotina comercial.</h3>
								<p>
									Publique os catálogos das empresas que representa, veja a
									demanda dos clientes e aprove ou rejeite os pedidos.
								</p>
								<Link className="role-link" href="/auth/login">
									Entrar como representante{" "}
									<svg className="arrow" aria-hidden="true">
										<use href="#cp-arrow"></use>
									</svg>
								</Link>
							</article>
						</div>
					</div>
				</section>
				<section className="faq-section wrap" id="duvidas">
					<div className="faq-intro">
						<div className="kicker">DÚVIDAS FREQUENTES</div>
						<h2>
							Antes da primeira
							<br />
							comparação.
						</h2>
						<p>
							Entenda como a lista vira uma comparação e qual é o papel do
							pedido.
						</p>
					</div>
					<div className="faqs">
						<details>
							<summary>Como começo a comparar preços?</summary>
							<p>
								Envie sua lista de compras em Excel ou CSV. Você pode baixar o
								template para preparar o arquivo. A plataforma cruza os itens
								com os catálogos dos fornecedores da sua carteira.
							</p>
						</details>
						<details>
							<summary>Como vejo qual fornecedor tem o menor preço?</summary>
							<p>
								Os preços aparecem lado a lado. Em cada linha, o menor valor
								entre as ofertas comparadas fica destacado, com a identificação
								do fornecedor. A comparação é por item.
							</p>
						</details>
						<details>
							<summary>Existe um percentual de economia garantido?</summary>
							<p>
								Não. O Compara Pró mostra os preços para apoiar sua decisão. O
								resultado depende dos itens da sua lista e das ofertas dos
								fornecedores. O menor valor é identificado por item, entre as
								ofertas comparadas.
							</p>
						</details>
						<details>
							<summary>O pedido confirma a compra?</summary>
							<p>
								Não. O pedido reúne as ofertas que você selecionou. Depois do
								envio, o representante aprova ou rejeita. Você acompanha o
								status: pendente, aprovado, rejeitado ou expirado.
							</p>
						</details>
						<details>
							<summary>Qual é o acesso do representante?</summary>
							<p>
								Use a opção Entrar para acessar uma organização existente. O
								representante atua por uma ou mais empresas fornecedoras e
								gerencia catálogos, clientes e pedidos.
							</p>
						</details>
						<details>
							<summary>Posso comparar qualquer fornecedor?</summary>
							<p>
								A comparação inclui somente os fornecedores da sua carteira.
								Você pode solicitar a inclusão de outro fornecedor; o
								representante precisa aprovar.
							</p>
						</details>
						<details>
							<summary>E se um item não corresponder ao catálogo?</summary>
							<p>
								A comparação mostra os itens que encontraram correspondência e
								os que ficaram sem par. Você pode conferir os resultados e
								ajustar a correspondência manualmente.
							</p>
						</details>
						<details>
							<summary>Como o total da demonstração é calculado?</summary>
							<p>
								O total multiplica a quantidade de cada item selecionado pelo
								menor preço unitário mostrado na linha. Os itens, fornecedores e
								valores deste exemplo são ilustrativos.
							</p>
						</details>
					</div>
				</section>
				<div className="closing-stack wrap">
					<section className="closing" aria-label="Acessar o Compara Pró">
						<div>
							<p className="label">ESCOLHA COMO USAR O COMPARA PRÓ</p>
							<h2>Vamos colocar os preços na mesa?</h2>
						</div>
						<div className="hero-doors">
							<Link className="button" href="/auth/login">
								Começar agora{" "}
								<svg className="arrow" aria-hidden="true">
									<use href="#cp-arrow"></use>
								</svg>
							</Link>
						</div>
					</section>
					<section
						className="contact-desk"
						aria-labelledby="contact-desk-title"
					>
						<div className="contact-desk-copy">
							<h2 id="contact-desk-title">Quer conversar antes de entrar?</h2>
							<p>
								Chame o comercial no WhatsApp e fale com uma pessoa real. Tire
								dúvidas de comprador ou representante, entenda o fluxo e veja se
								o Compara&nbsp;PRÓ cabe na sua operação — sem formulário e sem
								fila de ticket.
							</p>
							<ul className="contact-points">
								<li>
									<svg aria-hidden="true">
										<use href="#cp-whatsapp"></use>
									</svg>
									<span>WhatsApp direto com o atendimento comercial</span>
								</li>
								<li>
									<svg aria-hidden="true">
										<use href="#cp-person"></use>
									</svg>
									<span>Atendimento humano para comprador e representante</span>
								</li>
								<li>
									<svg aria-hidden="true">
										<use href="#cp-checklist"></use>
									</svg>
									<span>Explicação do produto e do próximo passo</span>
								</li>
							</ul>
						</div>
						<aside className="contact-desk-card" aria-label="Contato WhatsApp">
							<div className="contact-desk-status">
								<span className="contact-pulse" aria-hidden="true" />
								<span>Atendimento comercial no WhatsApp</span>
							</div>
							<p className="contact-desk-kicker">Número do comercial</p>
							<a
								className="contact-phone"
								href="https://wa.me/555599611317"
								target="_blank"
								rel="noreferrer noopener"
							>
								+55 55 9961-1317
							</a>
							<p className="contact-desk-note">
								Toque no número ou no botão abaixo e a conversa abre na hora.
							</p>
							<a
								className="button whatsapp whatsapp-lg"
								href="https://wa.me/555599611317"
								target="_blank"
								rel="noreferrer noopener"
							>
								<span className="button-lead">
									<span className="wa-badge" aria-hidden="true">
										<svg className="wa-icon" viewBox="0 0 24 24">
											<use href="#cp-whatsapp"></use>
										</svg>
									</span>
									Abrir conversa no WhatsApp
								</span>
								<svg className="arrow wa-arrow" aria-hidden="true">
									<use href="#cp-arrow"></use>
								</svg>
							</a>
						</aside>
					</section>
				</div>
			</main>
			<footer className="footer">
				<div className="wrap footer-inner">
					<a
						className="brand"
						href="#top"
						aria-label="Compara Pró, voltar ao início"
					>
						<BrandMark symbolOnly size={25} />
						Compara <span>PRÓ</span>
					</a>
					<div className="footer-copy">
						<p>
							© {new Date().getFullYear()} Compara Pró · Comparação de preços
							para compras no atacado.
						</p>
						<p className="footer-credit">
							Desenvolvido&nbsp;por&nbsp;
							<a
								href="https://osystems.com.br"
								target="_blank"
								rel="noreferrer noopener"
							>
								oSystems
							</a>
						</p>
					</div>
					<a href="#top">
						Voltar ao topo{" "}
						<svg className="arrow" aria-hidden="true">
							<use href="#cp-arrow"></use>
						</svg>
					</a>
				</div>
			</footer>
		</div>
	);
}
