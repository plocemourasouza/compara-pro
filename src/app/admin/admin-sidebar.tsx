"use client";

import { motion } from "framer-motion";
import {
	BarChart3,
	Building2,
	LayoutDashboard as Dashboard,
	FileText,
	Home,
	LogOut,
	Package,
	Settings,
	ShoppingCart,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserAvatar } from "@/components/shared/user-avatar";
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

interface AdminSidebarProps {
	user: User;
}

const navigation = [
	{
		name: "Dashboard",
		href: "/admin",
		icon: Dashboard,
		current: true,
	},
	{
		name: "Usuários",
		href: "/admin/users",
		icon: Users,
		current: false,
	},
	{
		name: "Empresas",
		href: "/admin/companies",
		icon: Building2,
		current: false,
	},
	{
		name: "Produtos",
		href: "/admin/products",
		icon: Package,
		current: false,
	},
	{
		name: "Pré-pedidos",
		href: "/admin/pre-orders",
		icon: ShoppingCart,
		current: false,
	},
	{
		name: "Histórico",
		href: "/admin/history",
		icon: FileText,
		current: false,
	},
	{
		name: "Relatórios",
		href: "/admin/reports",
		icon: BarChart3,
		current: false,
	},
	{
		name: "Configurações",
		href: "/admin/settings",
		icon: Settings,
		current: false,
	},
];

export default function AdminSidebar({ user }: AdminSidebarProps) {
	const pathname = usePathname();

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
				<div className="flex items-center h-17 px-6 border-b border-border">
					<BarChart3 className="h-8 w-8 text-primary" />
					<div className="ml-3">
						<div className="text-lg font-semibold text-foreground">
							Compara Pró
						</div>
						<div className="text-xs text-muted-foreground">Painel Admin</div>
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
							Administração
						</div>

						{navigation.map((item) => {
							const isActive = pathname === item.href;
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
											layoutId="admin-nav-active"
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
									<span className="relative z-10">{item.name}</span>
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
