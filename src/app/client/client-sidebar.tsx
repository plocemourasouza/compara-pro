"use client";

import {
	BarChart3,
	LayoutDashboard as Dashboard,
	FileText,
	Home,
	LogOut,
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

interface ClientSidebarProps {
	user: User;
}

const navigation = [
	{
		name: "Dashboard",
		href: "/client",
		icon: Dashboard,
	},
	{
		name: "Upload de Lista",
		href: "/client/upload",
		icon: Upload,
	},
	{
		name: "Comparar Preços",
		href: "/client/compare",
		icon: BarChart3,
	},
	{
		name: "Pré-pedidos",
		href: "/client/pre-orders",
		icon: ShoppingCart,
		badge: "2",
	},
	{
		name: "Histórico",
		href: "/client/history",
		icon: FileText,
	},
	{
		name: "Configurações",
		href: "/client/settings",
		icon: Settings,
	},
];

export default function ClientSidebar({ user }: ClientSidebarProps) {
	const pathname = usePathname();

	const handleLogout = () => {
		// biome-ignore lint/suspicious/noDocumentCookie: clears the auth_token cookie on logout
		document.cookie = "auth_token=; Max-Age=0; path=/";
		localStorage.removeItem("user");
		window.location.href = "/auth/login";
	};

	return (
		<div className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200">
			<div className="flex flex-col h-full">
				{/* Logo */}
				<div className="flex items-center h-16 px-6 border-b border-gray-200">
					<BarChart3 className="h-8 w-8 text-blue-600" />
					<div className="ml-3">
						<div className="text-lg font-semibold text-gray-900">
							PriceCompare
						</div>
						<div className="text-xs text-gray-500">Painel Cliente</div>
					</div>
				</div>

				{/* Navigation */}
				<nav className="flex-1 px-4 py-6 space-y-2">
					{/* Voltar para Dashboard */}
					<Link
						href="/dashboard"
						className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 hover:text-gray-900 mb-4"
					>
						<Home className="mr-3 h-4 w-4" />
						Voltar ao Dashboard
					</Link>

					<div className="border-t border-gray-200 pt-4">
						<div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
							Cliente
						</div>

						{navigation.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										isActive
											? "bg-blue-100 text-blue-700"
											: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
										"group flex items-center px-3 py-2 text-sm font-medium rounded-md",
									)}
								>
									<item.icon
										className={cn(
											isActive
												? "text-blue-500"
												: "text-gray-400 group-hover:text-gray-500",
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
				<div className="border-t border-gray-200 p-4">
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
							<p className="text-sm font-medium text-gray-700">{user.name}</p>
							<p className="text-xs text-gray-500">{user.email}</p>
						</div>
					</div>
					<Button
						onClick={handleLogout}
						variant="ghost"
						size="sm"
						className="w-full mt-3 text-gray-600 hover:text-gray-900"
					>
						<LogOut className="mr-2 h-4 w-4" />
						Sair
					</Button>
				</div>
			</div>
		</div>
	);
}
