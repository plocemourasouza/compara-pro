import {
	ArrowRight,
	BarChart3,
	Clock,
	Shield,
	Star,
	TrendingDown,
	Zap,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
	return (
		<div className="min-h-screen bg-background">
			{/* Navigation */}
			<nav className="bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
				<div className="container mx-auto px-6 py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center space-x-2">
							<BarChart3 className="h-8 w-8 text-primary" />
							<span className="text-xl font-bold text-foreground">
								Compara Pró
							</span>
						</div>
						<div className="flex items-center space-x-4">
							<Link href="/auth/login">
								<Button variant="ghost">Entrar</Button>
							</Link>
							<Link href="/auth/register">
								<Button>Começar Agora</Button>
							</Link>
						</div>
					</div>
				</div>
			</nav>

			{/* Hero Section */}
			<section className="py-20 px-6">
				<div className="container mx-auto text-center">
					<Badge variant="secondary" className="mb-6">
						<Star className="h-4 w-4 mr-1" />
						Plataforma B2B #1 em Comparação de Preços
					</Badge>

					<h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
						Reduza seus custos em
						<span className="text-primary block">até 30% com IA</span>
					</h1>

					<p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
						Conecte-se aos melhores fornecedores, compare preços automaticamente
						e faça pré-pedidos em segundos. A solução completa para compras B2B
						inteligentes.
					</p>

					<div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
						<Link href="/auth/register">
							<Button size="lg" className="text-lg px-8 py-4">
								Teste Grátis por 14 Dias
								<ArrowRight className="ml-2 h-5 w-5" />
							</Button>
						</Link>
						<Button size="lg" variant="outline" className="text-lg px-8 py-4">
							<Clock className="mr-2 h-5 w-5" />
							Agendar Demo
						</Button>
					</div>

					{/* Social Proof */}
					<div className="flex flex-col items-center space-y-4">
						<p className="text-sm text-muted-foreground">
							Confiado por mais de 500+ empresas
						</p>
						<div className="flex items-center space-x-8 opacity-60">
							<div className="bg-muted px-6 py-2 rounded">Empresa A</div>
							<div className="bg-muted px-6 py-2 rounded">Empresa B</div>
							<div className="bg-muted px-6 py-2 rounded">Empresa C</div>
						</div>
					</div>
				</div>
			</section>

			{/* Results Section */}
			<section className="py-16 px-6 bg-card">
				<div className="container mx-auto">
					<div className="grid md:grid-cols-4 gap-8 text-center">
						<div>
							<div className="text-4xl font-bold text-primary mb-2">30%</div>
							<div className="text-muted-foreground">
								Redução média de custos
							</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-success mb-2">5min</div>
							<div className="text-muted-foreground">
								Tempo para comparar preços
							</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-chart-4 mb-2">500+</div>
							<div className="text-muted-foreground">Empresas conectadas</div>
						</div>
						<div>
							<div className="text-4xl font-bold text-primary mb-2">98%</div>
							<div className="text-muted-foreground">Precisão do matching</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-20 px-6">
				<div className="container mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-foreground mb-4">
							Tudo que você precisa para comprar melhor
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Nossa plataforma integra fornecedores, compara preços
							automaticamente e acelera seu processo de compras
						</p>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						<Card className="border-2 hover:border-primary/40 transition-colors">
							<CardHeader>
								<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
									<Zap className="h-6 w-6 text-primary" />
								</div>
								<CardTitle>Comparação Automática</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									IA avançada compara milhares de produtos em segundos. Upload
									sua lista e receba cotações automaticamente.
								</p>
							</CardContent>
						</Card>

						<Card className="border-2 hover:border-success/40 transition-colors">
							<CardHeader>
								<div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-4">
									<TrendingDown className="h-6 w-6 text-success" />
								</div>
								<CardTitle>Economia Garantida</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Encontre os melhores preços do mercado automaticamente.
									Histórico de economia média de 30% nos custos.
								</p>
							</CardContent>
						</Card>

						<Card className="border-2 hover:border-chart-4/40 transition-colors">
							<CardHeader>
								<div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center mb-4">
									<Shield className="h-6 w-6 text-chart-4" />
								</div>
								<CardTitle>Fornecedores Verificados</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Rede de fornecedores pré-qualificados e verificados. Compre
									com segurança e confiança total.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			{/* How it Works */}
			<section className="py-20 px-6 bg-muted">
				<div className="container mx-auto">
					<div className="text-center mb-16">
						<h2 className="text-4xl font-bold text-foreground mb-4">
							Como funciona em 3 passos simples
						</h2>
					</div>

					<div className="grid md:grid-cols-3 gap-8">
						<div className="text-center">
							<div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
								1
							</div>
							<h3 className="text-xl font-semibold mb-4">Upload sua Lista</h3>
							<p className="text-muted-foreground">
								Faça upload do seu arquivo Excel ou CSV com os produtos que
								precisa comprar
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-success text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
								2
							</div>
							<h3 className="text-xl font-semibold mb-4">IA Compara Preços</h3>
							<p className="text-muted-foreground">
								Nossa IA encontra e compara preços de centenas de fornecedores
								automaticamente
							</p>
						</div>

						<div className="text-center">
							<div className="w-16 h-16 bg-chart-4 text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
								3
							</div>
							<h3 className="text-xl font-semibold mb-4">Feche o Negócio</h3>
							<p className="text-muted-foreground">
								Receba cotações, escolha a melhor oferta e finalize a compra em
								1 clique
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-20 px-6 bg-primary text-primary-foreground">
				<div className="container mx-auto text-center">
					<h2 className="text-4xl font-bold mb-6">
						Pronto para economizar em suas compras?
					</h2>
					<p className="text-xl mb-8 opacity-90">
						Junte-se a centenas de empresas que já economizam milhares por mês
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link href="/auth/register">
							<Button
								size="lg"
								variant="secondary"
								className="text-lg px-8 py-4"
							>
								Começar Teste Grátis
								<ArrowRight className="ml-2 h-5 w-5" />
							</Button>
						</Link>
						<Button
							size="lg"
							variant="outline"
							className="text-lg px-8 py-4 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
						>
							Falar com Consultor
						</Button>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-foreground text-background py-12 px-6">
				<div className="container mx-auto">
					<div className="grid md:grid-cols-4 gap-8">
						<div>
							<div className="flex items-center space-x-2 mb-4">
								<BarChart3 className="h-6 w-6 text-primary" />
								<span className="text-lg font-bold">Compara Pró</span>
							</div>
							<p className="text-background/60">
								A plataforma B2B que revoluciona suas compras
							</p>
						</div>
						<div>
							<h4 className="font-semibold mb-4">Produto</h4>
							<ul className="space-y-2 text-background/60">
								<li>
									{/* biome-ignore lint/a11y/useValidAnchor: placeholder footer link */}
									<a href="#" className="hover:text-background">
										Funcionalidades
									</a>
								</li>
								<li>
									{/* biome-ignore lint/a11y/useValidAnchor: placeholder footer link */}
									<a href="#" className="hover:text-background">
										Preços
									</a>
								</li>
								<li>
									{/* biome-ignore lint/a11y/useValidAnchor: placeholder footer link */}
									<a href="#" className="hover:text-background">
										Integrações
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-4">Empresa</h4>
							<ul className="space-y-2 text-background/60">
								<li>
									{/* biome-ignore lint/a11y/useValidAnchor: placeholder footer link */}
									<a href="#" className="hover:text-background">
										Sobre
									</a>
								</li>
								<li>
									{/* biome-ignore lint/a11y/useValidAnchor: placeholder footer link */}
									<a href="#" className="hover:text-background">
										Blog
									</a>
								</li>
								<li>
									{/* biome-ignore lint/a11y/useValidAnchor: placeholder footer link */}
									<a href="#" className="hover:text-background">
										Carreira
									</a>
								</li>
							</ul>
						</div>
						<div>
							<h4 className="font-semibold mb-4">Suporte</h4>
							<ul className="space-y-2 text-background/60">
								<li>
									{/* biome-ignore lint/a11y/useValidAnchor: placeholder footer link */}
									<a href="#" className="hover:text-background">
										Ajuda
									</a>
								</li>
								<li>
									{/* biome-ignore lint/a11y/useValidAnchor: placeholder footer link */}
									<a href="#" className="hover:text-background">
										Contato
									</a>
								</li>
								<li>
									{/* biome-ignore lint/a11y/useValidAnchor: placeholder footer link */}
									<a href="#" className="hover:text-background">
										Status
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className="border-t border-background/20 mt-8 pt-8 text-center text-background/60">
						<p>&copy; 2024 Compara Pró. Todos os direitos reservados.</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
