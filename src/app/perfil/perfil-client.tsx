"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Camera, Loader2, Lock, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
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
	changePasswordAction,
	updateProfileAction,
} from "@/lib/actions/profile";
import { masks } from "@/lib/utils/masks";

type ProfileUser = {
	id: string;
	name: string;
	email: string;
	phone: string;
	avatarUrl: string | null;
	role: string;
	company: string | null;
};

const ROLE_LABEL: Record<string, string> = {
	ADMIN: "Administrador",
	REPRESENTATIVE: "Representante",
	CLIENT: "Cliente",
};

const fade = {
	initial: { opacity: 0, y: 12 },
	animate: { opacity: 1, y: 0 },
};

export default function PerfilClient({ user }: { user: ProfileUser }) {
	const router = useRouter();
	const fileInput = useRef<HTMLInputElement>(null);
	const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
	const [uploading, setUploading] = useState(false);
	const [profile, setProfile] = useState({
		name: user.name,
		phone: user.phone,
	});
	const [savingProfile, setSavingProfile] = useState(false);
	const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
	const [savingPwd, setSavingPwd] = useState(false);

	const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;
		setUploading(true);
		try {
			const fd = new FormData();
			fd.append("file", file);
			const res = await fetch("/api/profile/avatar", {
				method: "POST",
				body: fd,
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error ?? "Erro ao enviar foto");
			setAvatarUrl(data.avatarUrl);
			toast.success("Foto de perfil atualizada.");
			router.refresh();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Erro ao enviar foto");
		} finally {
			setUploading(false);
		}
	};

	const removeAvatar = async () => {
		setUploading(true);
		try {
			const res = await fetch("/api/profile/avatar", { method: "DELETE" });
			if (!res.ok) throw new Error();
			setAvatarUrl(null);
			toast.success("Foto removida.");
			router.refresh();
		} catch {
			toast.error("Não foi possível remover a foto.");
		} finally {
			setUploading(false);
		}
	};

	const saveProfile = async () => {
		setSavingProfile(true);
		const result = await updateProfileAction({
			name: profile.name,
			email: user.email,
			phone: profile.phone,
		});
		setSavingProfile(false);
		if (result.success) {
			toast.success("Perfil atualizado.");
			router.refresh();
		} else {
			toast.error(result.error ?? "Erro ao salvar");
		}
	};

	const savePassword = async () => {
		if (pwd.next !== pwd.confirm) {
			toast.error("As senhas não coincidem.");
			return;
		}
		setSavingPwd(true);
		const result = await changePasswordAction({
			currentPassword: pwd.current,
			newPassword: pwd.next,
		});
		setSavingPwd(false);
		if (result.success) {
			toast.success("Senha alterada.");
			setPwd({ current: "", next: "", confirm: "" });
		} else {
			toast.error(result.error ?? "Erro ao alterar senha");
		}
	};

	return (
		<div className="mx-auto max-w-3xl space-y-6 p-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Meu perfil</h1>
					<p className="text-muted-foreground">
						Gerencie seus dados, foto e senha.
					</p>
				</div>
			</div>

			{/* Identidade + avatar */}
			<motion.div initial={fade.initial} animate={fade.animate}>
				<Card>
					<CardContent className="flex flex-col items-center gap-4 pt-6 sm:flex-row sm:items-center sm:gap-6">
						<div className="relative">
							<UserAvatar
								name={profile.name || user.name}
								avatarUrl={avatarUrl}
								role={user.role}
								className="size-24 text-2xl ring-2 ring-border"
							/>
							<button
								type="button"
								onClick={() => fileInput.current?.click()}
								disabled={uploading}
								aria-label="Trocar foto"
								className="absolute right-0 bottom-0 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow transition hover:opacity-90 disabled:opacity-50"
							>
								{uploading ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<Camera className="h-4 w-4" />
								)}
							</button>
							<input
								ref={fileInput}
								type="file"
								accept="image/png,image/jpeg,image/webp"
								className="hidden"
								onChange={onPickFile}
							/>
						</div>
						<div className="flex-1 text-center sm:text-left">
							<div className="flex items-center justify-center gap-2 sm:justify-start">
								<h2 className="font-semibold text-lg">
									{profile.name || user.name}
								</h2>
								<Badge variant="secondary">
									{ROLE_LABEL[user.role] ?? user.role}
								</Badge>
							</div>
							<p className="text-muted-foreground text-sm">{user.email}</p>
							{user.company && (
								<p className="text-muted-foreground text-xs">{user.company}</p>
							)}
							{avatarUrl && (
								<Button
									variant="ghost"
									size="sm"
									className="mt-2 text-destructive hover:text-destructive"
									onClick={removeAvatar}
									disabled={uploading}
								>
									<Trash2 className="mr-1 h-4 w-4" />
									Remover foto
								</Button>
							)}
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Dados */}
			<motion.div
				initial={fade.initial}
				animate={fade.animate}
				transition={{ delay: 0.05 }}
			>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<User className="h-5 w-5" />
							Dados pessoais
						</CardTitle>
						<CardDescription>
							O e-mail e a empresa não podem ser alterados aqui.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="name">Nome completo</Label>
							<Input
								id="name"
								value={profile.name}
								onChange={(e) =>
									setProfile((p) => ({ ...p, name: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Telefone</Label>
							<Input
								id="phone"
								inputMode="numeric"
								placeholder="(00) 00000-0000"
								value={profile.phone}
								onChange={(e) =>
									setProfile((p) => ({
										...p,
										phone: masks.phone(e.target.value),
									}))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">E-mail</Label>
							<Input id="email" value={user.email} disabled />
						</div>
						<div className="space-y-2">
							<Label htmlFor="company">Empresa</Label>
							<Input id="company" value={user.company ?? "—"} disabled />
						</div>
						<div className="sm:col-span-2 flex justify-end">
							<Button onClick={saveProfile} disabled={savingProfile}>
								{savingProfile ? "Salvando..." : "Salvar alterações"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</motion.div>

			{/* Senha */}
			<motion.div
				initial={fade.initial}
				animate={fade.animate}
				transition={{ delay: 0.1 }}
			>
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<Lock className="h-5 w-5" />
							Segurança
						</CardTitle>
						<CardDescription>Altere sua senha de acesso.</CardDescription>
					</CardHeader>
					<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div className="space-y-2">
							<Label htmlFor="current">Senha atual</Label>
							<Input
								id="current"
								type="password"
								value={pwd.current}
								onChange={(e) =>
									setPwd((p) => ({ ...p, current: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="next">Nova senha</Label>
							<Input
								id="next"
								type="password"
								value={pwd.next}
								onChange={(e) =>
									setPwd((p) => ({ ...p, next: e.target.value }))
								}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirm">Confirmar</Label>
							<Input
								id="confirm"
								type="password"
								value={pwd.confirm}
								onChange={(e) =>
									setPwd((p) => ({ ...p, confirm: e.target.value }))
								}
							/>
						</div>
						<div className="sm:col-span-3 flex justify-end">
							<Button
								variant="outline"
								onClick={savePassword}
								disabled={
									savingPwd || !pwd.current || !pwd.next || !pwd.confirm
								}
							>
								{savingPwd ? "Alterando..." : "Alterar senha"}
							</Button>
						</div>
					</CardContent>
				</Card>
			</motion.div>
		</div>
	);
}
