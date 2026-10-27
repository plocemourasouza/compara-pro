"use client";

import { motion } from "framer-motion";
import {
	BarChart3,
	Building2,
	LayoutDashboard as Dashboard,
	FileText,
	Handshake,
	Package,
	Settings,
	ShoppingCart,
	Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppSidebarFrame } from "@/components/shared/app-sidebar-frame";
import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";

const navigation = [
	{
		name: "Dashboard",
		href: "/admin",
		icon: Dashboard,
		current: true,
	},
	{
		name: "Representantes",
		href: "/admin/representatives",
		icon: Handshake,
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
		name: "Pedidos",
		href: "/admin/pre-orders",
		icon: ShoppingCart,
		current: false,
	},
	{
		name: "Relatórios",
		href: "/admin/reports",
		icon: BarChart3,
		current: false,
	},
	{
		name: "Administradores",
		href: "/admin/users",
		icon: Users,
		current: false,
	},
	{
		name: "Histórico",
		href: "/admin/history",
		icon: FileText,
		current: false,
	},
	{
		name: "Configurações",
		href: "/admin/settings",
		icon: Settings,
		current: false,
	},
];

export default function AdminSidebar() {
	const pathname = usePathname();

	return (
		<AppSidebarFrame>
			<div className="flex h-full min-h-0 flex-col">
				<div className="flex h-16 items-center border-b border-border px-6">
					<BrandMark />
				</div>

				<nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-6">
					<div>
						{navigation.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={item.name}
									href={item.href}
									className={cn(
										"group relative flex items-center rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
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
			</div>
		</AppSidebarFrame>
	);
}
