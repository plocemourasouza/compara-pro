"use client";

import {
	BarChart3,
	Bell,
	FileText,
	Home,
	LogOut,
	Package,
	Settings,
	ShoppingCart,
	Upload,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type User = {
	id: string;
	name: string;
	email: string;
	role: string;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
};

interface SupplierSidebarProps {
	user: User;
}

type BadgeKey = "pending" | "unread";

const navigation: Array<{
	name: string;
	href: string;
	icon: typeof Home;
	badgeKey?: BadgeKey;
}> = [
	{ name: "Dashboard", href: "/supplier", icon: Home },
	{ name: "Upload de Produtos", href: "/supplier/upload", icon: Upload },
	{ name: "Meus Produtos", href: "/supplier/products", icon: Package },
	{ name: "Clientes", href: "/supplier/clients", icon: Users },
	{
		name: "Pré-pedidos",
		href: "/supplier/pre-orders",
		icon: ShoppingCart,
		badgeKey: "pending",
	},
	{ name: "Histórico", href: "/supplier/history", icon: FileText },
	{
		name: "Notificações",
		href: "/supplier/notifications",
		icon: Bell,
		badgeKey: "unread",
	},
	{ name: "Configurações", href: "/supplier/settings", icon: Settings },
];

export default function SupplierSidebar({ user }: SupplierSidebarProps) {
	const pathname = usePathname();
	const [counts, setCounts] = useState<{ pending: number; unread: number }>({
		pending: 0,
		unread: 0,
	});

	useEffect(() => {
		let active = true;
		Promise.all([
			fetch("/api/supplier/dashboard")
				.then((r) => (r.ok ? r.json() : null))
				.then((d) => d?.metrics?.preOrders?.pending ?? 0)
				.catch(() => 0),
			fetch("/api/notifications?unreadOnly=true&limit=1")
				.then((r) => (r.ok ? r.json() : null))
				.then((d) => d?.unreadCount ?? 0)
				.catch(() => 0),
		]).then(([pending, unread]) => {
			if (active) setCounts({ pending, unread });
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
					<BarChart3 className="h-8 w-8 text-success" />
					<div className="ml-3">
						<div className="text-lg font-semibold text-foreground">
							Compara Pró
						</div>
						<div className="text-xs text-muted-foreground">
							Painel Fornecedor
						</div>
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
							Fornecedor
						</div>

						{navigation.map((item) => {
							const isActive =
								item.href === "/supplier"
									? pathname === "/supplier"
									: pathname === item.href ||
										pathname.startsWith(`${item.href}/`);
							const badgeCount = item.badgeKey ? counts[item.badgeKey] : 0;
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										isActive
											? "bg-success/10 text-success"
											: "text-muted-foreground hover:bg-muted hover:text-foreground",
										"group flex items-center px-3 py-2 text-sm font-medium rounded-md",
									)}
								>
									<item.icon
										className={cn(
											isActive
												? "text-success"
												: "text-muted-foreground group-hover:text-muted-foreground",
											"mr-3 h-5 w-5",
										)}
										aria-hidden="true"
									/>
									<span className="flex-1">{item.name}</span>
									{badgeCount > 0 && (
										<Badge variant="secondary" className="ml-2">
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
					<div className="flex items-center">
						<Avatar className="h-8 w-8">
							<AvatarFallback>
								{user.name
									.split(" ")
									.map((n) => n[0])
									.join("")
									.toUpperCase()}
							</AvatarFallback>
						</Avatar>
						<div className="ml-3">
							<p className="text-sm font-medium text-foreground">{user.name}</p>
							<p className="text-xs text-muted-foreground">{user.email}</p>
						</div>
					</div>
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
