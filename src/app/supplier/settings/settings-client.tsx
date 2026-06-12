"use client";

import { Bell, Palette, Shield, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	changePasswordAction,
	savePreferencesAction,
	updateProfileAction,
} from "@/lib/actions/profile";

type UserType = {
	id: string;
	name: string;
	email: string;
	phone?: string | null;
	area: string;
	preferences?: unknown;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
};

interface SettingsClientProps {
	user: UserType;
}

export default function SettingsClient({ user }: SettingsClientProps) {
	const prefs = (user.preferences ?? {}) as Partial<{
		emailNotifications: boolean;
		pushNotifications: boolean;
		priceAlerts: boolean;
		language: string;
		theme: string;
	}>;

	const [profileData, setProfileData] = useState({
		name: user.name,
		email: user.email,
		phone: user.phone ?? "",
		company: user.company?.name || "",
	});

	const [notifications, setNotifications] = useState({
		emailNotifications: prefs.emailNotifications ?? true,
		pushNotifications: prefs.pushNotifications ?? false,
		priceAlerts: prefs.priceAlerts ?? true,
		orderUpdates: true,
		newOrders: true,
	});

	const [preferences, setPreferences] = useState({
		language: prefs.language ?? "pt-BR",
		timezone: "America/Sao_Paulo",
		currency: "BRL",
		theme: prefs.theme === "system" ? "auto" : (prefs.theme ?? "light"),
	});

	const [passwordData, setPasswordData] = useState({
		current: "",
		next: "",
		confirm: "",
	});

	const [savingProfile, setSavingProfile] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [savingPrefs, setSavingPrefs] = useState(false);

	const handleSaveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setSavingProfile(true);
		const res = await updateProfileAction({
			name: profileData.name,
			email: profileData.email,
			phone: profileData.phone,
		});
		setSavingProfile(false);
		if (res.success) toast.success("Perfil atualizado.");
		else toast.error(res.error);
	};

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		if (passwordData.next !== passwordData.confirm) {
			toast.error("A confirmação não confere com a nova senha.");
			return;
		}
		setSavingPassword(true);
		const res = await changePasswordAction({
			currentPassword: passwordData.current,
			newPassword: passwordData.next,
		});
		setSavingPassword(false);
		if (res.success) {
			toast.success("Senha alterada.");
			setPasswordData({ current: "", next: "", confirm: "" });
		} else toast.error(res.error);
	};

	const handleSavePreferences = async () => {
		setSavingPrefs(true);
		const res = await savePreferencesAction({
			emailNotifications: notifications.emailNotifications,
			pushNotifications: notifications.pushNotifications,
			priceAlerts: notifications.priceAlerts,
			language: preferences.language,
			theme: preferences.theme === "auto" ? "system" : preferences.theme,
		});
		setSavingPrefs(false);
		if (res.success) toast.success("Preferências salvas.");
		else toast.error(res.error);
	};

	const getRoleBadge = (role: string) => {
		switch (role) {
			case "ADMIN":
				return <Badge variant="destructive">Administrador</Badge>;
			case "REPRESENTATIVE":
				return <Badge variant="secondary">Representante</Badge>;
			case "CLIENT":
				return <Badge variant="default">Cliente</Badge>;
			default:
				return <Badge variant="outline">Desconhecido</Badge>;
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
				<p className="text-muted-foreground">
					Gerencie suas configurações pessoais e preferências
				</p>
			</div>

			<Tabs defaultValue="profile" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="profile" className="flex items-center gap-2">
						<User className="h-4 w-4" />
						Perfil
					</TabsTrigger>
					<TabsTrigger
						value="notifications"
						className="flex items-center gap-2"
					>
						<Bell className="h-4 w-4" />
						Notificações
					</TabsTrigger>
					<TabsTrigger value="preferences" className="flex items-center gap-2">
						<Palette className="h-4 w-4" />
						Preferências
					</TabsTrigger>
					<TabsTrigger value="security" className="flex items-center gap-2">
						<Shield className="h-4 w-4" />
						Segurança
					</TabsTrigger>
				</TabsList>

				<TabsContent value="profile" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Informações do Perfil</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSaveProfile} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="name">Nome Completo</Label>
										<Input
											id="name"
											value={profileData.name}
											onChange={(e) =>
												setProfileData({ ...profileData, name: e.target.value })
											}
										/>
									</div>
									<div>
										<Label htmlFor="email">Email</Label>
										<Input
											id="email"
											type="email"
											value={profileData.email}
											onChange={(e) =>
												setProfileData({
													...profileData,
													email: e.target.value,
												})
											}
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="phone">Telefone</Label>
										<Input
											id="phone"
											value={profileData.phone}
											onChange={(e) =>
												setProfileData({
													...profileData,
													phone: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<Label htmlFor="company">Empresa</Label>
										<Input id="company" value={profileData.company} disabled />
									</div>
								</div>
								<div className="flex items-center gap-2">
									<Label>Função:</Label>
									{getRoleBadge(user.area)}
								</div>
								<Button type="submit" disabled={savingProfile}>
									{savingProfile ? "Salvando..." : "Salvar Alterações"}
								</Button>
							</form>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="notifications" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Configurações de Notificações</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<Label htmlFor="email-notifications">
											Notificações por Email
										</Label>
										<p className="text-sm text-muted-foreground">
											Receba notificações importantes por email
										</p>
									</div>
									<Switch
										id="email-notifications"
										checked={notifications.emailNotifications}
										onCheckedChange={(checked) =>
											setNotifications({
												...notifications,
												emailNotifications: checked,
											})
										}
									/>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<div>
										<Label htmlFor="push-notifications">
											Notificações Push
										</Label>
										<p className="text-sm text-muted-foreground">
											Receba notificações em tempo real no navegador
										</p>
									</div>
									<Switch
										id="push-notifications"
										checked={notifications.pushNotifications}
										onCheckedChange={(checked) =>
											setNotifications({
												...notifications,
												pushNotifications: checked,
											})
										}
									/>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<div>
										<Label htmlFor="price-alerts">Alertas de Preço</Label>
										<p className="text-sm text-muted-foreground">
											Notificações sobre mudanças significativas de preço
										</p>
									</div>
									<Switch
										id="price-alerts"
										checked={notifications.priceAlerts}
										onCheckedChange={(checked) =>
											setNotifications({
												...notifications,
												priceAlerts: checked,
											})
										}
									/>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<div>
										<Label htmlFor="order-updates">
											Atualizações de Pedidos
										</Label>
										<p className="text-sm text-muted-foreground">
											Status e atualizações dos pedidos recebidos
										</p>
									</div>
									<Switch
										id="order-updates"
										checked={notifications.orderUpdates}
										onCheckedChange={(checked) =>
											setNotifications({
												...notifications,
												orderUpdates: checked,
											})
										}
									/>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<div>
										<Label htmlFor="new-orders">Novos Pedidos</Label>
										<p className="text-sm text-muted-foreground">
											Notificações quando novos pré-pedidos forem recebidos
										</p>
									</div>
									<Switch
										id="new-orders"
										checked={notifications.newOrders}
										onCheckedChange={(checked) =>
											setNotifications({
												...notifications,
												newOrders: checked,
											})
										}
									/>
								</div>
							</div>
							<Button onClick={handleSavePreferences} disabled={savingPrefs}>
								{savingPrefs ? "Salvando..." : "Salvar Preferências"}
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="preferences" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Preferências Gerais</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="language">Idioma</Label>
									<select
										id="language"
										className="w-full p-2 border border-border rounded-md"
										value={preferences.language}
										onChange={(e) =>
											setPreferences({
												...preferences,
												language: e.target.value,
											})
										}
									>
										<option value="pt-BR">Português (Brasil)</option>
										<option value="en-US">English (US)</option>
										<option value="es-ES">Español</option>
									</select>
								</div>
								<div>
									<Label htmlFor="timezone">Fuso Horário</Label>
									<select
										id="timezone"
										className="w-full p-2 border border-border rounded-md"
										value={preferences.timezone}
										onChange={(e) =>
											setPreferences({
												...preferences,
												timezone: e.target.value,
											})
										}
									>
										<option value="America/Sao_Paulo">
											America/São Paulo (UTC-3)
										</option>
										<option value="America/New_York">
											America/New York (UTC-5)
										</option>
										<option value="Europe/London">Europe/London (UTC+0)</option>
									</select>
								</div>
							</div>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<Label htmlFor="currency">Moeda</Label>
									<select
										id="currency"
										className="w-full p-2 border border-border rounded-md"
										value={preferences.currency}
										onChange={(e) =>
											setPreferences({
												...preferences,
												currency: e.target.value,
											})
										}
									>
										<option value="BRL">Real Brasileiro (R$)</option>
										<option value="USD">Dólar Americano ($)</option>
										<option value="EUR">Euro (€)</option>
									</select>
								</div>
								<div>
									<Label htmlFor="theme">Tema</Label>
									<select
										id="theme"
										className="w-full p-2 border border-border rounded-md"
										value={preferences.theme}
										onChange={(e) =>
											setPreferences({
												...preferences,
												theme: e.target.value,
											})
										}
									>
										<option value="light">Claro</option>
										<option value="dark">Escuro</option>
										<option value="auto">Automático</option>
									</select>
								</div>
							</div>
							<Button onClick={handleSavePreferences} disabled={savingPrefs}>
								{savingPrefs ? "Salvando..." : "Salvar Preferências"}
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="security" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Segurança da Conta</CardTitle>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleChangePassword} className="space-y-4">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="current-password">Senha Atual</Label>
										<Input
											id="current-password"
											type="password"
											placeholder="Digite sua senha atual"
											value={passwordData.current}
											onChange={(e) =>
												setPasswordData({
													...passwordData,
													current: e.target.value,
												})
											}
										/>
									</div>
									<div>
										<Label htmlFor="new-password">Nova Senha</Label>
										<Input
											id="new-password"
											type="password"
											placeholder="Digite a nova senha"
											value={passwordData.next}
											onChange={(e) =>
												setPasswordData({
													...passwordData,
													next: e.target.value,
												})
											}
										/>
									</div>
								</div>
								<div>
									<Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
									<Input
										id="confirm-password"
										type="password"
										placeholder="Confirme a nova senha"
										value={passwordData.confirm}
										onChange={(e) =>
											setPasswordData({
												...passwordData,
												confirm: e.target.value,
											})
										}
									/>
								</div>
								<Button type="submit" disabled={savingPassword}>
									{savingPassword ? "Alterando..." : "Alterar Senha"}
								</Button>
							</form>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Atividade da Conta</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">Último Login</p>
										<p className="text-sm text-muted-foreground">
											Hoje às 14:30 - IP: 192.168.1.1
										</p>
									</div>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">Conta Criada</p>
										<p className="text-sm text-muted-foreground">
											15 de Janeiro de 2024
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
