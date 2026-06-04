"use client";

import { addDays } from "date-fns";
import {
	Activity,
	Building2,
	Clock,
	DollarSign,
	Download,
	Filter,
	Package,
	TrendingUp,
	Users,
} from "lucide-react";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import {
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface User {
	id: string;
	name: string;
	email: string;
	role: "ADMIN" | "SUPPLIER" | "CLIENT";
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
}

interface ReportsClientProps {
	user: User;
}

// Dados mockados para demonstração
const statsData = {
	totalUsers: 145,
	totalCompanies: 67,
	totalProducts: 12450,
	totalComparisons: 892,
	monthlyGrowth: 12.5,
	avgSavings: 28.7,
};

const chartData = [
	{ month: "Jan", comparisons: 45, savings: 15.2 },
	{ month: "Fev", comparisons: 52, savings: 18.1 },
	{ month: "Mar", comparisons: 78, savings: 22.5 },
	{ month: "Abr", comparisons: 65, savings: 19.8 },
	{ month: "Mai", comparisons: 89, savings: 25.3 },
	{ month: "Jun", comparisons: 94, savings: 28.7 },
];

const companyData = [
	{ name: "Clientes", value: 42, color: "#3b82f6" },
	{ name: "Fornecedores", value: 25, color: "#10b981" },
];

const topSuppliersData = [
	{ name: "TechnoMax Ltda", orders: 45, avgSavings: 32.1 },
	{ name: "Digital Supply Co", orders: 38, avgSavings: 28.5 },
	{ name: "ProTech Solutions", orders: 29, avgSavings: 25.8 },
	{ name: "InnovaMaq", orders: 24, avgSavings: 30.2 },
	{ name: "GlobalTech Supply", orders: 18, avgSavings: 22.7 },
];

const recentActivities = [
	{
		id: 1,
		action: "Nova comparação criada",
		user: "João Silva",
		company: "TechCorp",
		time: "2 minutos atrás",
	},
	{
		id: 2,
		action: "Pré-pedido finalizado",
		user: "Maria Santos",
		company: "InnovaTech",
		time: "15 minutos atrás",
	},
	{
		id: 3,
		action: "Novo usuário registrado",
		user: "Carlos Oliveira",
		company: "ProSolutions",
		time: "1 hora atrás",
	},
	{
		id: 4,
		action: "Upload de produtos realizado",
		user: "Ana Costa",
		company: "SupplyMax",
		time: "2 horas atrás",
	},
];

export function ReportsClient({ user: _user }: ReportsClientProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [reportType, setReportType] = useState("usage");
	const [dateRange, setDateRange] = useState<DateRange | undefined>({
		from: addDays(new Date(), -30),
		to: new Date(),
	});

	const handleExportReport = async () => {
		setIsLoading(true);

		// Simular exportação
		await new Promise((resolve) => setTimeout(resolve, 2000));

		setIsLoading(false);
		// TODO: Implementar Server Action para exportar relatório
	};

	const handleGenerateReport = async () => {
		setIsLoading(true);

		// Simular geração de relatório
		await new Promise((resolve) => setTimeout(resolve, 1500));

		setIsLoading(false);
		// TODO: Implementar Server Action para gerar relatório personalizado
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold text-gray-900">Relatórios</h1>
					<p className="text-sm text-gray-600 mt-1">
						Análises detalhadas e métricas do sistema
					</p>
				</div>
				<Button
					onClick={handleExportReport}
					disabled={isLoading}
					className="flex items-center gap-2"
				>
					<Download className="h-4 w-4" />
					{isLoading ? "Exportando..." : "Exportar PDF"}
				</Button>
			</div>

			{/* Filtros */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Filter className="h-5 w-5" />
						<CardTitle>Filtros de Relatório</CardTitle>
					</div>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label>Tipo de Relatório</Label>
							<Select value={reportType} onValueChange={setReportType}>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="usage">Uso do Sistema</SelectItem>
									<SelectItem value="financial">Análise Financeira</SelectItem>
									<SelectItem value="performance">Performance</SelectItem>
									<SelectItem value="companies">Empresas</SelectItem>
									<SelectItem value="products">Produtos</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Período</Label>
							<DatePickerWithRange date={dateRange} setDate={setDateRange} />
						</div>

						<div className="flex items-end">
							<Button
								onClick={handleGenerateReport}
								disabled={isLoading}
								className="w-full"
							>
								{isLoading ? "Gerando..." : "Gerar Relatório"}
							</Button>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Métricas Gerais */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Total de Usuários
								</p>
								<p className="text-2xl font-bold text-gray-900">
									{statsData.totalUsers}
								</p>
							</div>
							<div className="p-2 bg-blue-100 rounded-full">
								<Users className="h-6 w-6 text-blue-600" />
							</div>
						</div>
						<div className="flex items-center mt-2">
							<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
							<span className="text-sm text-green-500">
								+{statsData.monthlyGrowth}% este mês
							</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Empresas Ativas
								</p>
								<p className="text-2xl font-bold text-gray-900">
									{statsData.totalCompanies}
								</p>
							</div>
							<div className="p-2 bg-green-100 rounded-full">
								<Building2 className="h-6 w-6 text-green-600" />
							</div>
						</div>
						<div className="flex items-center mt-2">
							<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
							<span className="text-sm text-green-500">+8.2% este mês</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Produtos Cadastrados
								</p>
								<p className="text-2xl font-bold text-gray-900">
									{statsData.totalProducts.toLocaleString()}
								</p>
							</div>
							<div className="p-2 bg-purple-100 rounded-full">
								<Package className="h-6 w-6 text-purple-600" />
							</div>
						</div>
						<div className="flex items-center mt-2">
							<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
							<span className="text-sm text-green-500">+15.7% este mês</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-gray-600">
									Economia Média
								</p>
								<p className="text-2xl font-bold text-gray-900">
									{statsData.avgSavings}%
								</p>
							</div>
							<div className="p-2 bg-orange-100 rounded-full">
								<DollarSign className="h-6 w-6 text-orange-600" />
							</div>
						</div>
						<div className="flex items-center mt-2">
							<TrendingUp className="h-4 w-4 text-green-500 mr-1" />
							<span className="text-sm text-green-500">+3.2% este mês</span>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Gráfico de Comparações e Economia */}
				<Card>
					<CardHeader>
						<CardTitle>Comparações e Economia por Mês</CardTitle>
						<CardDescription>
							Evolução mensal das comparações realizadas e economia gerada
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<LineChart data={chartData}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis yAxisId="left" />
								<YAxis yAxisId="right" orientation="right" />
								<Tooltip />
								<Line
									yAxisId="left"
									type="monotone"
									dataKey="comparisons"
									stroke="#3b82f6"
									strokeWidth={2}
									name="Comparações"
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="savings"
									stroke="#10b981"
									strokeWidth={2}
									name="Economia (%)"
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Distribuição de Empresas */}
				<Card>
					<CardHeader>
						<CardTitle>Distribuição de Empresas</CardTitle>
						<CardDescription>
							Proporção entre clientes e fornecedores cadastrados
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ResponsiveContainer width="100%" height={300}>
							<PieChart>
								<Pie
									data={companyData}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, value }) => `${name}: ${value}`}
									outerRadius={80}
									fill="#8884d8"
									dataKey="value"
								>
									{companyData.map((entry) => (
										<Cell key={`cell-${entry.name}`} fill={entry.color} />
									))}
								</Pie>
								<Tooltip />
								<Legend />
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Top Fornecedores */}
				<Card>
					<CardHeader>
						<CardTitle>Top Fornecedores</CardTitle>
						<CardDescription>
							Fornecedores com melhor performance em pedidos e economia
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{topSuppliersData.map((supplier, index) => (
								<div
									key={supplier.name}
									className="flex items-center justify-between p-3 border rounded-lg"
								>
									<div className="flex items-center gap-3">
										<div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
											{index + 1}
										</div>
										<div>
											<p className="font-medium text-gray-900">
												{supplier.name}
											</p>
											<p className="text-sm text-gray-500">
												{supplier.orders} pedidos
											</p>
										</div>
									</div>
									<Badge
										variant="outline"
										className="text-green-600 border-green-600"
									>
										{supplier.avgSavings}% economia
									</Badge>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Atividades Recentes */}
				<Card>
					<CardHeader>
						<CardTitle>Atividades Recentes</CardTitle>
						<CardDescription>
							Últimas ações realizadas no sistema
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentActivities.map((activity) => (
								<div
									key={activity.id}
									className="flex items-start gap-3 p-3 border rounded-lg"
								>
									<div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
										<Activity className="h-3 w-3 text-blue-600" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium text-gray-900 text-sm">
											{activity.action}
										</p>
										<p className="text-sm text-gray-600">
											{activity.user} - {activity.company}
										</p>
										<div className="flex items-center gap-1 mt-1">
											<Clock className="h-3 w-3 text-gray-400" />
											<span className="text-xs text-gray-400">
												{activity.time}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Exportação de Dados */}
			<Card>
				<CardHeader>
					<CardTitle>Exportação de Dados</CardTitle>
					<CardDescription>
						Exporte relatórios detalhados em diferentes formatos
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<Button variant="outline" className="flex items-center gap-2">
							<Download className="h-4 w-4" />
							Relatório Completo (PDF)
						</Button>
						<Button variant="outline" className="flex items-center gap-2">
							<Download className="h-4 w-4" />
							Dados Financeiros (Excel)
						</Button>
						<Button variant="outline" className="flex items-center gap-2">
							<Download className="h-4 w-4" />
							Métricas de Uso (CSV)
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
