/** @vitest-environment jsdom */
import { within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/react";
import { LandingPage } from "./landing-page";

vi.mock("./landing.css", () => ({}));

describe("landing pública aprovada", () => {
	it("apresenta a comparação por item e mantém todos os acessos nas rotas reais", () => {
		render(<LandingPage />);
		expect(
			screen.getByRole("heading", {
				level: 1,
				name: /Compare preços\. Decida item por item\./,
			}),
		).toBeInTheDocument();
		const registerLinks = screen.getAllByRole("link", {
			name: /^Criar conta(?: de comprador)?$/,
		});
		const loginLinks = screen.getAllByRole("link", {
			name: /^Entrar(?: como representante)?$/,
		});
		expect(registerLinks).toHaveLength(1);
		expect(loginLinks).toHaveLength(2);
		const nav = screen.getByRole("navigation", { name: "Navegação principal" });
		const headerLogin = within(nav).getByRole("link", { name: /^Entrar$/ });
		expect(headerLogin).toHaveAttribute("href", "/auth/login");
		expect(headerLogin.querySelector("use")).toHaveAttribute(
			"href",
			"#cp-login",
		);
		expect(
			within(nav).queryByRole("link", { name: /Criar conta/ }),
		).not.toBeInTheDocument();
		for (const link of registerLinks) {
			expect(link).toHaveAttribute("href", "/auth/register");
		}
		for (const link of loginLinks) {
			expect(link).toHaveAttribute("href", "/auth/login");
		}
		const startLinks = screen.getAllByRole("link", { name: /^Começar agora$/ });
		expect(startLinks).toHaveLength(2);
		for (const link of startLinks) {
			expect(link).toHaveAttribute("href", "/auth/login");
		}
		expect(
			screen.queryByText(/acesso.*não está disponível nesta prévia/i),
		).not.toBeInTheDocument();
		expect(
			screen.queryByText(/imagem ilustrativa gerada por ia/i),
		).not.toBeInTheDocument();
		expect(
			screen.getByText(new RegExp(`© ${new Date().getFullYear()} Compara Pró`)),
		).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "oSystems" })).toHaveAttribute(
			"href",
			"https://osystems.com.br",
		);
		const whatsapp = screen.getByRole("link", {
			name: /Abrir conversa no WhatsApp/i,
		});
		expect(whatsapp).toHaveAttribute("href", "https://wa.me/555599611317");
		expect(
			screen.getByRole("link", { name: "+55 55 9961-1317" }),
		).toHaveAttribute("href", "https://wa.me/555599611317");
		expect(
			screen.getByRole("heading", {
				name: /Quer conversar antes de entrar/i,
			}),
		).toBeInTheDocument();
	});
});
