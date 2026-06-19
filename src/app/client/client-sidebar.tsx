"use client";

import { motion } from "framer-motion";
import {
	BarChart3,
	Building2,
	LayoutDashboard as Dashboard,
	FileText,
	Home,
	LogOut,
	Settings,
	ShoppingCart,
	Upload,
	UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type User = {
	id: string;
	name: string;
	email: string;
	area: string;
	avatarUrl?: string | null;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
};

interface ClientSidebarProps {
	user: User;
}

type BadgeKey = "pending";

const navigation: Array<{
	name: string;
	href: string;
	icon: typeof Home;
	badgeKey?: BadgeKey;
}> = [
	{ name: "Dashboard", href: "/client", icon: Dashboard },
	{ name: "Upload de Lista", href: "/client/upload", icon: Upload },
	{ name: "Comparar Preços", href: "/client/compare", icon: BarChart3 },
	{ name: "Meus Fornecedores", href: "/client/suppliers", icon: Building2 },
	{
		name: "Pré-pedidos",
		href: "/client/pre-orders",
		icon: ShoppingCart,
		badgeKey: "pending",
	},
	{ name: "Histórico", href: "/client/history", icon: FileText },
	{ name: "Usuários", href: "/client/usuarios", icon: UserCog },
	{ name: "Configurações", href: "/client/settings", icon: Settings },
];

export default function ClientSidebar({ user }: ClientSidebarProps) {
	const pathname = usePathname();
	const [counts, setCounts] = useState<{ pending: number }>({
		pending: 0,
	});

	useEffect(() => {
		let active = true;
		fetch("/api/client/dashboard")
			.then((r) => (r.ok ? r.json() : null))
			.then((d) => d?.metrics?.preOrders?.pending ?? 0)
			.catch(() => 0)
			.then((pending) => {
				if (active) setCounts({ pending });
			});
		return () => {
			active = false;
		};
	}, []);

	const handleLogout = () => {
		// biome-ignore lint/suspicious/noDocumentCookie: clears the auth_token cookie on logout
		document.cookie = "auth_token=; Max-Age=0; path=/";
		localStorage.removeItem("user");
		window.location.href = "/auth/login";
	};

	return (
		<div className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border">
			<div className="flex flex-col h-full">
				{/* Logo */}
				<div className="flex items-center h-16 px-6 border-b border-border">
					<BarChart3 className="h-8 w-8 text-primary" />
					<div className="ml-3">
						<div className="text-lg font-semibold text-foreground">
							Compara Pró
						</div>
						<div className="text-xs text-muted-foreground">Painel Cliente</div>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 px-4 py-6 space-y-2">
					{/* Voltar para Dashboard */}
					<Link
						href="/dashboard"
						className="flex items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-muted hover:text-foreground mb-4"
					>
						<Home className="mr-3 h-4 w-4" />
						Voltar ao Dashboard
					</Link>

					<div className="border-t border-border pt-4">
						<div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
							Cliente
						</div>

						{navigation.map((item) => {
							const isActive =
								item.href === "/client"
									? pathname === "/client"
									: pathname === item.href ||
										pathname.startsWith(`${item.href}/`);
							const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										"group relative flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
										isActive
											? "text-primary"
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
									)}
								>
									{isActive && (
										<motion.span
											layoutId="client-nav-active"
											className="absolute inset-0 rounded-md bg-primary/10"
											transition={{
												type: "spring",
												stiffness: 380,
												damping: 32,
											}}
										/>
									)}
									<item.icon
										className={cn(
											"relative z-10 mr-3 h-5 w-5",
											isActive
												? "text-primary"
												: "text-muted-foreground group-hover:text-muted-foreground",
										)}
										aria-hidden="true"
									/>
									<span className="relative z-10 flex-1">{item.name}</span>
									{badgeCount > 0 && (
										<Badge variant="secondary" className="relative z-10 ml-2">
											{badgeCount}
										</Badge>
									)}
								</Link>
							);
						})}
					</div>
				</nav>

				{/* User Info */}
				<div className="border-t border-border p-4">
					<Link
						href="/perfil"
						className="-m-2 flex items-center rounded-md p-2 transition-colors hover:bg-muted"
					>
						<UserAvatar
							name={user.name}
							avatarUrl={user.avatarUrl}
							role={user.area}
							className="h-9 w-9"
						/>
						<div className="ml-3 min-w-0">
							<p className="truncate text-sm font-medium text-foreground">
								{user.name}
							</p>
							<p className="truncate text-xs text-muted-foreground">
								{user.email}
							</p>
						</div>
					</Link>
					<Button
						onClick={handleLogout}
						variant="ghost"
						size="sm"
						className="w-full mt-3 text-muted-foreground hover:text-foreground"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Sair
					</Button>
				</div>
			</div>
		</div>
	);
}
