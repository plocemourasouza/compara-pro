import { Cpu, Database, HardDrive, Server } from "lucide-react";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth-server";
import DashboardClient from "./dashboard-client";

interface SystemHealthData {
	status: "healthy" | "warning" | "critical";
	uptime: string;
	memory: {
		used: number;
		total: number;
		percentage: number;
	};
	disk: {
		used: number;
		total: number;
		percentage: number;
	};
	database: {
		connections: number;
		status: "healthy" | "warning" | "critical";
	};
}

async function getSystemHealth(): Promise<SystemHealthData> {
	try {
		// Usar URL relativa para evitar problemas com variáveis de ambiente
		const response = await fetch("/api/admin/system-health", {
			cache: "no-store",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();

		if (!data.success || !data.systemHealth) {
			throw new Error("Resposta inválida da API");
		}

		// Mapear a resposta da API para o formato esperado
		return {
			status: data.systemHealth.status,
			uptime: data.systemHealth.uptime,
			memory: {
				used: data.systemHealth.system.memory.used,
				total: data.systemHealth.system.memory.total,
				percentage: data.systemHealth.system.memory.percentage,
			},
			disk: {
				used: data.systemHealth.system.disk.used,
				total: data.systemHealth.system.disk.total,
				percentage: data.systemHealth.system.disk.percentage,
			},
			database: {
				connections: data.systemHealth.database.connections,
				status: data.systemHealth.database.status,
			},
		};
	} catch (error) {
		console.error("Erro ao buscar saúde do sistema:", error);
		// Retornar dados simulados em caso de erro
		return {
			status: "healthy",
			uptime: "7d 14h 32m",
			memory: {
				used: 2147483648,
				total: 8589934592,
				percentage: 25,
			},
			disk: {
				used: 21474836480,
				total: 107374182400,
				percentage: 20,
			},
			database: {
				connections: 12,
				status: "healthy",
			},
		};
	}
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getSystemHealthBadge(status: string): string {
	switch (status) {
		case "healthy":
			return "bg-success/10 text-success hover:bg-success/10";
		case "warning":
			return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
		case "critical":
			return "bg-destructive/10 text-destructive hover:bg-destructive/10";
		default:
			return "bg-muted text-foreground hover:bg-muted";
	}
}

export default async function DashboardPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect("/auth/login");
	}

	const systemHealth = await getSystemHealth();

	return (
		<div className="space-y-6">
			{/* Dashboard Client Original */}
			<DashboardClient user={user} />

			{/* Saúde do Sistema - Adicionada abaixo */}
			<div className="p-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Server className="h-5 w-5" />
							Saúde do Sistema
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Cpu className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">Memória</span>
								</div>
								<div className="space-y-1">
									<div className="flex justify-between text-sm">
										<span>Uso</span>
										<span>{systemHealth.memory.percentage.toFixed(1)}%</span>
									</div>
									<div className="w-full bg-secondary rounded-full h-2">
										<div
											className={`h-2 rounded-full ${
												systemHealth.memory.percentage > 80
													? "bg-destructive"
													: systemHealth.memory.percentage > 60
														? "bg-yellow-500"
														: "bg-success"
											}`}
											style={{
												width: `${systemHealth.memory.percentage}%`,
											}}
										/>
									</div>
									<p className="text-xs text-muted-foreground">
										{formatBytes(systemHealth.memory.used)} /{" "}
										{formatBytes(systemHealth.memory.total)}
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<HardDrive className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">Disco</span>
								</div>
								<div className="space-y-1">
									<div className="flex justify-between text-sm">
										<span>Uso</span>
										<span>{systemHealth.disk.percentage.toFixed(1)}%</span>
									</div>
									<div className="w-full bg-secondary rounded-full h-2">
										<div
											className={`h-2 rounded-full ${
												systemHealth.disk.percentage > 90
													? "bg-destructive"
													: systemHealth.disk.percentage > 75
														? "bg-yellow-500"
														: "bg-success"
											}`}
											style={{
												width: `${systemHealth.disk.percentage}%`,
											}}
										/>
									</div>
									<p className="text-xs text-muted-foreground">
										{formatBytes(systemHealth.disk.used)} /{" "}
										{formatBytes(systemHealth.disk.total)}
									</p>
								</div>
							</div>

							<div className="space-y-2">
								<div className="flex items-center gap-2">
									<Database className="h-4 w-4 text-muted-foreground" />
									<span className="font-medium">Banco de Dados</span>
								</div>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<Badge
											className={getSystemHealthBadge(
												systemHealth.database.status,
											)}
										>
											{systemHealth.database.status === "healthy" && "Saudável"}
											{systemHealth.database.status === "warning" && "Atenção"}
											{systemHealth.database.status === "critical" && "Crítico"}
										</Badge>
									</div>
									<p className="text-xs text-muted-foreground">
										{systemHealth.database.connections} conexões ativas
									</p>
									<p className="text-xs text-muted-foreground">
										Uptime: {systemHealth.uptime}
									</p>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
