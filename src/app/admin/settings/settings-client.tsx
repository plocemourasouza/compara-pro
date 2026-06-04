"use client";

import {
	Bell,
	Building2,
	Eye,
	EyeOff,
	Globe,
	Key,
	Palette,
	Save,
	Shield,
	User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

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

interface SettingsClientProps {
	user: User;
}

export function SettingsClient({ user }: SettingsClientProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	// Estados para configurações
	const [emailNotifications, setEmailNotifications] = useState(true);
	const [pushNotifications, setPushNotifications] = useState(true);
	const [priceAlerts, setPriceAlerts] = useState(true);
	const [language, setLanguage] = useState("pt-BR");
	const [theme, setTheme] = useState("system");

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		// Simular salvamento
		await new Promise((resolve) => setTimeout(resolve, 1000));

		setIsLoading(false);
		// TODO: Implementar Server Action para atualizar perfil
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		// Simular mudança de senha
		await new Promise((resolve) => setTimeout(resolve, 1000));

		setIsLoading(false);
		// TODO: Implementar Server Action para alterar senha
	};

	const handleSavePreferences = async () => {
		setIsLoading(true);

		// Simular salvamento de preferências
		await new Promise((resolve) => setTimeout(resolve, 1000));

		setIsLoading(false);
		// TODO: Implementar Server Action para salvar preferências
	};

	const getRoleBadge = (role: string) => {
		const variants = {
			ADMIN: { variant: "destructive" as const, label: "Administrador" },
			SUPPLIER: { variant: "default" as const, label: "Fornecedor" },
			CLIENT: { variant: "secondary" as const, label: "Cliente" },
		};

		const config = variants[role as keyof typeof variants] || variants.CLIENT;

		return <Badge variant={config.variant}>{config.label}</Badge>;
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					Configurações
				</h1>
				<p className="text-sm text-muted-foreground mt-1">
					Gerencie suas preferências de conta e configurações do sistema
				</p>
			</div>

			<div className="grid gap-6">
				{/* Informações do Perfil */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<UserIcon className="h-5 w-5" />
							<CardTitle>Informações do Perfil</CardTitle>
						</div>
						<CardDescription>
							Atualize suas informações pessoais e de contato
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSaveProfile} className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nome Completo</Label>
									<Input
										id="name"
										name="name"
										defaultValue={user.name}
										disabled={isLoading}
										required
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										name="email"
										type="email"
										defaultValue={user.email}
										disabled={isLoading}
										required
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label>Função</Label>
									<div className="flex items-center gap-2">
										<Shield className="h-4 w-4 text-muted-foreground" />
										{getRoleBadge(user.role)}
									</div>
								</div>

								<div className="space-y-2">
									<Label>Empresa</Label>
									<div className="flex items-center gap-2">
										<Building2 className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm text-foreground">
											{user.company?.name || "Não associado"}
										</span>
									</div>
								</div>
							</div>

							<div className="flex justify-end">
								<Button
									type="submit"
									disabled={isLoading}
									className="flex items-center gap-2"
								>
									<Save className="h-4 w-4" />
									{isLoading ? "Salvando..." : "Salvar Alterações"}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				{/* Alterar Senha */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Key className="h-5 w-5" />
							<CardTitle>Alterar Senha</CardTitle>
						</div>
						<CardDescription>
							Mantenha sua conta segura com uma senha forte
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleChangePassword} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="currentPassword">Senha Atual</Label>
								<div className="relative">
									<Input
										id="currentPassword"
										name="currentPassword"
										type={showCurrentPassword ? "text" : "password"}
										disabled={isLoading}
										required
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
										onClick={() => setShowCurrentPassword(!showCurrentPassword)}
									>
										{showCurrentPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="newPassword">Nova Senha</Label>
									<div className="relative">
										<Input
											id="newPassword"
											name="newPassword"
											type={showNewPassword ? "text" : "password"}
											disabled={isLoading}
											minLength={6}
											required
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											onClick={() => setShowNewPassword(!showNewPassword)}
										>
											{showNewPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
									<div className="relative">
										<Input
											id="confirmPassword"
											name="confirmPassword"
											type={showConfirmPassword ? "text" : "password"}
											disabled={isLoading}
											minLength={6}
											required
										/>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
											onClick={() =>
												setShowConfirmPassword(!showConfirmPassword)
											}
										>
											{showConfirmPassword ? (
												<EyeOff className="h-4 w-4" />
											) : (
												<Eye className="h-4 w-4" />
											)}
										</Button>
									</div>
								</div>
							</div>

							<div className="flex justify-end">
								<Button
									type="submit"
									disabled={isLoading}
									className="flex items-center gap-2"
								>
									<Key className="h-4 w-4" />
									{isLoading ? "Alterando..." : "Alterar Senha"}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>

				{/* Notificações */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Bell className="h-5 w-5" />
							<CardTitle>Notificações</CardTitle>
						</div>
						<CardDescription>
							Configure como você deseja receber notificações
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Notificações por Email</Label>
								<p className="text-sm text-muted-foreground">
									Receba atualizações importantes por email
								</p>
							</div>
							<Switch
								checked={emailNotifications}
								onCheckedChange={setEmailNotifications}
							/>
						</div>

						<Separator />

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Notificações Push</Label>
								<p className="text-sm text-muted-foreground">
									Receba notificações em tempo real no navegador
								</p>
							</div>
							<Switch
								checked={pushNotifications}
								onCheckedChange={setPushNotifications}
							/>
						</div>

						<Separator />

						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Alertas de Preço</Label>
								<p className="text-sm text-muted-foreground">
									Seja notificado sobre mudanças significativas de preços
								</p>
							</div>
							<Switch checked={priceAlerts} onCheckedChange={setPriceAlerts} />
						</div>
					</CardContent>
				</Card>

				{/* Preferências */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Palette className="h-5 w-5" />
							<CardTitle>Preferências</CardTitle>
						</div>
						<CardDescription>
							Personalize sua experiência no sistema
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="language">Idioma</Label>
								<Select value={language} onValueChange={setLanguage}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="pt-BR">
											<div className="flex items-center gap-2">
												<Globe className="h-4 w-4" />
												Português (Brasil)
											</div>
										</SelectItem>
										<SelectItem value="en-US">
											<div className="flex items-center gap-2">
												<Globe className="h-4 w-4" />
												English (US)
											</div>
										</SelectItem>
										<SelectItem value="es-ES">
											<div className="flex items-center gap-2">
												<Globe className="h-4 w-4" />
												Español
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="theme">Tema</Label>
								<Select value={theme} onValueChange={setTheme}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="system">Sistema</SelectItem>
										<SelectItem value="light">Claro</SelectItem>
										<SelectItem value="dark">Escuro</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="flex justify-end">
							<Button
								onClick={handleSavePreferences}
								disabled={isLoading}
								className="flex items-center gap-2"
							>
								<Save className="h-4 w-4" />
								{isLoading ? "Salvando..." : "Salvar Preferências"}
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Informações Adicionais para Admin */}
				{user.role === "ADMIN" && (
					<Card>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Shield className="h-5 w-5" />
								<CardTitle>Configurações de Administrador</CardTitle>
							</div>
							<CardDescription>
								Configurações específicas para administradores do sistema
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="p-4 border border-primary bg-primary/10 rounded-lg">
									<h4 className="font-medium text-primary mb-2">
										Permissões Administrativas
									</h4>
									<ul className="text-sm text-primary space-y-1">
										<li>• Gerenciar usuários e empresas</li>
										<li>• Acessar relatórios do sistema</li>
										<li>• Configurar parâmetros globais</li>
										<li>• Monitorar atividades do sistema</li>
									</ul>
								</div>

								<div className="text-xs text-muted-foreground">
									ID do usuário: {user.id}
								</div>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
