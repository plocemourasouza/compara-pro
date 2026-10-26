import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
	title: "Compara Pró — Compare preços no atacado, item por item.",
	description:
		"Compare os preços dos fornecedores da sua carteira a partir de uma lista em Excel ou CSV. Gere o pré-pedido para a resposta do representante.",
};

export default function Home() {
	return <LandingPage />;
}
