export const DEMO_PRODUCTS = [
	{
		id: 1,
		name: "Arroz branco tipo 1",
		detail: "Pacote 5 kg",
		qty: 20,
		unit: "pct.",
		category: "Mercearia",
		north: 2240,
		south: 2390,
	},
	{
		id: 2,
		name: "Feijão carioca",
		detail: "Pacote 1 kg",
		qty: 30,
		unit: "pct.",
		category: "Mercearia",
		north: 689,
		south: 649,
	},
	{
		id: 3,
		name: "Óleo de soja",
		detail: "Garrafa 900 ml",
		qty: 24,
		unit: "un.",
		category: "Mercearia",
		north: 579,
		south: 619,
	},
	{
		id: 4,
		name: "Açúcar refinado",
		detail: "Pacote 1 kg",
		qty: 20,
		unit: "pct.",
		category: "Mercearia",
		north: 379,
		south: 349,
	},
	{
		id: 5,
		name: "Café torrado e moído",
		detail: "Pacote 500 g",
		qty: 12,
		unit: "pct.",
		category: "Mercearia",
		north: 1890,
		south: 1840,
	},
	{
		id: 6,
		name: "Detergente líquido neutro",
		detail: "Frasco 500 ml",
		qty: 24,
		unit: "un.",
		category: "Limpeza",
		north: 189,
		south: 209,
	},
] as const;

export type DemoProduct = (typeof DEMO_PRODUCTS)[number];
export const formatPrice = (cents: number) =>
	(cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const lowestPrice = (p: DemoProduct) => Math.min(p.north, p.south);
export const winningSupplier = (p: DemoProduct) =>
	p.north <= p.south ? "Norte" : "Sul";
export const productTotal = (p: DemoProduct) => lowestPrice(p) * p.qty;
export const normalizeSearch = (value: string) =>
	value
		.toLocaleLowerCase("pt-BR")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

export function createOrderCsv(products: readonly DemoProduct[]) {
	const rows: (string | number)[][] = [
		["PRÉ-PEDIDO ILUSTRATIVO — NÃO ENVIADO"],
		[
			"Produto",
			"Apresentação",
			"Quantidade",
			"Unidade",
			"Fornecedor",
			"Preço unitário (R$)",
			"Subtotal (R$)",
		],
		...products.map((p) => [
			p.name,
			p.detail,
			p.qty,
			p.unit,
			winningSupplier(p),
			(lowestPrice(p) / 100).toFixed(2).replace(".", ","),
			(productTotal(p) / 100).toFixed(2).replace(".", ","),
		]),
	];
	return `\uFEFF${rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(";")).join("\r\n")}`;
}
