"use client";

import {
	BarChart3,
	FileText,
	Home,
	LogOut,
	Package,
	Settings,
	ShoppingCart,
	Upload,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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

const navigation = [
	{
		name: "Dashboard",
		href: "/supplier",
		icon: Home,
	},
	{
		name: "Upload de Produtos",
		href: "/supplier/upload",
		icon: Upload,
	},
	{
		name: "Meus Produtos",
		href: "/supplier/products",
		icon: Package,
	},
	{
		name: "Pré-pedidos",
		href: "/supplier/pre-orders",
		icon: ShoppingCart,
		badge: "3",
	},
	{
		name: "Histórico",
		href: "/supplier/history",
		icon: FileText,
	},
	{
		name: "Configurações",
		href: "/supplier/settings",
		icon: Settings,
	},
];

export default function SupplierSidebar({ user }: SupplierSidebarProps) {
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
							const isActive = pathname === item.href;
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
									{item.badge && (
										<Badge variant="secondary" className="ml-2">
											{item.badge}
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
