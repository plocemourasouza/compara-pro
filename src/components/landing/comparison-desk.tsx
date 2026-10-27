"use client";

import { useState } from "react";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	createOrderCsv,
	DEMO_PRODUCTS,
	formatPrice,
	lowestPrice,
	normalizeSearch,
	productTotal,
	winningSupplier,
} from "./comparison-data";
import { LandingIcon } from "./landing-icon";

export function ComparisonDesk() {
	const [selected, setSelected] = useState<Set<number>>(
		() => new Set(DEMO_PRODUCTS.map((p) => p.id)),
	);
	const [category, setCategory] = useState("all");
	const [search, setSearch] = useState("");
	const query = normalizeSearch(search);
	const visible = DEMO_PRODUCTS.filter(
		(p) =>
			(category === "all" || p.category === category) &&
			normalizeSearch(`${p.name} ${p.detail}`).includes(query),
	);
	const chosen = DEMO_PRODUCTS.filter((p) => selected.has(p.id));
	const total = chosen.reduce((sum, p) => sum + productTotal(p), 0);
	const visibleSelected = visible.filter((p) => selected.has(p.id)).length;
	const allVisibleSelected =
		visible.length > 0 && visibleSelected === visible.length;
	function toggleItem(id: number) {
		setSelected((current) => {
			const next = new Set(current);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}
	function toggleVisible() {
		setSelected((current) => {
			const next = new Set(current);
			for (const p of visible) {
				if (allVisibleSelected) next.delete(p.id);
				else next.add(p.id);
			}
			return next;
		});
	}
	function downloadOrder() {
		const url = URL.createObjectURL(
			new Blob([createOrderCsv(chosen)], { type: "text/csv;charset=utf-8;" }),
		);
		const link = document.createElement("a");
		link.href = url;
		link.download = "compara-pro-pre-pedido-exemplo.csv";
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
	return (
		<section
			className="comparison wrap reveal reveal-delay"
			id="comparacao"
			aria-label="Experimente uma comparação de preços ilustrativa"
		>
			<div className="comparison-intro">
				<div>
					<span className="kicker">EXPERIMENTE COM UMA LISTA DE EXEMPLO</span>
					<h2>
						O menor preço,
						<br className="mobile-break" /> item por item.
					</h2>
				</div>
				<p>
					Fornecedores da sua carteira, lado a lado.
					<br />O destaque indica o menor preço de cada linha.
				</p>
			</div>
			<Dialog>
				<div className="sheet">
					<div className="sheet-top">
						<div className="file">
							<span className="file-icon">
								<LandingIcon name="file" />
							</span>
							<div>
								<strong>lista-de-compras.xlsx</strong>
								<small>6 itens na lista · 2 fornecedores da carteira</small>
							</div>
						</div>
						<span className="demo-badge">DEMONSTRAÇÃO INTERATIVA</span>
					</div>
					<div className="sheet-tools">
						<fieldset className="tabs" aria-label="Filtrar categoria">
							{[
								{ value: "all", label: "Todos os itens (6)" },
								{ value: "Mercearia", label: "Mercearia" },
								{ value: "Limpeza", label: "Limpeza" },
							].map((tab) => (
								<button
									key={tab.value}
									type="button"
									aria-pressed={category === tab.value}
									onClick={() => setCategory(tab.value)}
								>
									{tab.label}
								</button>
							))}
						</fieldset>
						<label className="search">
							<LandingIcon name="search" />
							<input
								type="search"
								name="demo-search"
								aria-label="Buscar item na demonstração"
								placeholder="Buscar item…"
								autoComplete="off"
								value={search}
								onChange={(event) => setSearch(event.target.value)}
							/>
						</label>
					</div>
					<p className="mobile-hint">
						Deslize a tabela para comparar Norte e Sul{" "}
						<span aria-hidden="true">↔</span>
					</p>
					<section
						className="table-scroll"
						// biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard access to horizontal table scrolling.
						tabIndex={0}
						aria-label="Tabela comparativa. Role horizontalmente em telas pequenas."
					>
						<table>
							<caption className="sr-only">
								Preços unitários ilustrativos de dois fornecedores da carteira.
								O menor preço entre as ofertas comparadas aparece em verde.
							</caption>
							<thead>
								<tr>
									<th scope="col">
										<input
											type="checkbox"
											aria-label="Selecionar todos os itens visíveis"
											checked={allVisibleSelected}
											disabled={visible.length === 0}
											ref={(element) => {
												if (element)
													element.indeterminate =
														visibleSelected > 0 && !allVisibleSelected;
											}}
											onChange={toggleVisible}
										/>
									</th>
									<th scope="col">Item da sua lista</th>
									<th scope="col">Quantidade</th>
									<th scope="col">
										<span className="supplier-icon" aria-hidden="true">
											N
										</span>{" "}
										Distribuidora Norte
										<span className="unit-label">Preço unitário</span>
									</th>
									<th scope="col">
										<span className="supplier-icon" aria-hidden="true">
											S
										</span>{" "}
										Atacado Sul
										<span className="unit-label">Preço unitário</span>
									</th>
									<th scope="col">Melhor oferta</th>
								</tr>
							</thead>
							<tbody>
								{visible.map((p) => (
									<tr key={p.id}>
										<td>
											<input
												type="checkbox"
												checked={selected.has(p.id)}
												onChange={() => toggleItem(p.id)}
												aria-label={`Selecionar ${p.name}`}
											/>
										</td>
										<th scope="row" className="product">
											{p.name}
											<small>{p.detail}</small>
										</th>
										<td className="qty">
											{p.qty} {p.unit}
										</td>
										{(["north", "south"] as const).map((key) => (
											<td
												key={key}
												className={`price${p[key] === lowestPrice(p) ? " best" : ""}`}
											>
												<span className="best-inner">
													{formatPrice(p[key])}
													{p[key] === lowestPrice(p) && (
														<span
															className="check"
															role="img"
															aria-label="Menor preço"
														>
															✓
														</span>
													)}
												</span>
											</td>
										))}
										<td className="pick">{winningSupplier(p)}</td>
									</tr>
								))}
								{visible.length === 0 && (
									<tr>
										<td colSpan={6} className="empty">
											Nenhum item encontrado. Tente outra busca.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</section>
					<div className="sheet-bottom">
						<div className="selection-info">
							<LandingIcon name="checklist" />
							<span>
								<strong>
									{chosen.length}{" "}
									{chosen.length === 1
										? "item selecionado"
										: "itens selecionados"}
								</strong>{" "}
								· quantidade × menor preço
							</span>
						</div>
						<div className="total-group">
							<div className="total" aria-live="polite" aria-atomic="true">
								<small>Total ilustrativo dos itens selecionados</small>
								<strong>{formatPrice(total)}</strong>
							</div>
							<DialogTrigger asChild>
								<button
									className="button"
									type="button"
									disabled={chosen.length === 0}
								>
									Ver pedido <LandingIcon name="arrow" className="arrow" />
								</button>
							</DialogTrigger>
						</div>
					</div>
				</div>
				<DialogContent
					className="compara-landing order-modal"
					showCloseButton={false}
				>
					<div className="modal-top">
						<DialogTitle>Seu pedido.</DialogTitle>
						<DialogClose asChild>
							<button
								className="close"
								type="button"
								aria-label="Fechar pedido"
							>
								×
							</button>
						</DialogClose>
					</div>
					<DialogDescription className="modal-note">
						Exemplo com o menor preço dos itens selecionados. Na plataforma, o
						representante aprova ou rejeita o pedido enviado. Os valores
						desta demonstração são ilustrativos e nada será enviado.
					</DialogDescription>
					{(["Norte", "Sul"] as const).map((name) => {
						const items = chosen.filter((p) => winningSupplier(p) === name);
						if (!items.length) return null;
						return (
							<section className="order-group" key={name}>
								<h3>
									{name === "Norte" ? "Distribuidora Norte" : "Atacado Sul"}{" "}
									<span>
										{formatPrice(
											items.reduce((sum, p) => sum + productTotal(p), 0),
										)}
									</span>
								</h3>
								{items.map((p) => (
									<div className="order-row" key={p.id}>
										<span>
											{p.name}
											<small>
												{p.qty} {p.unit} × {formatPrice(lowestPrice(p))}
											</small>
										</span>
										<strong>{formatPrice(productTotal(p))}</strong>
									</div>
								))}
							</section>
						);
					})}
					<div className="modal-action">
						<div className="total">
							<small>Total ilustrativo</small>
							<strong>{formatPrice(total)}</strong>
						</div>
						<button className="button" type="button" onClick={downloadOrder}>
							Baixar exemplo em CSV{" "}
							<LandingIcon name="arrow" className="arrow" />
						</button>
					</div>
				</DialogContent>
			</Dialog>
			<div className="sheet-caption">
				<span className="legend">
					<b /> Verde = menor preço da linha.
				</span>
				<span>
					Itens, fornecedores e valores ilustrativos.
					<br />
					Selecione os itens para ver o pedido de exemplo.
				</span>
			</div>
		</section>
	);
}
