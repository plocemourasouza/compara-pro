"use client";

import { motion } from "framer-motion";
import {
	BarChart3,
	Building2,
	LayoutDashboard as Dashboard,
	FileText,
	type Home,
	Settings,
	ShoppingCart,
	Upload,
	UserCog,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AppSidebarFrame } from "@/components/shared/app-sidebar-frame";
import { BrandMark } from "@/components/shared/brand-mark";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
		name: "Pedidos",
		href: "/client/pre-orders",
		icon: ShoppingCart,
		badgeKey: "pending",
	},
	{ name: "Histórico", href: "/client/history", icon: FileText },
	{ name: "Usuários", href: "/client/usuarios", icon: UserCog },
	{ name: "Configurações", href: "/client/settings", icon: Settings },
];

export default function ClientSidebar() {
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

	return (
		<AppSidebarFrame>
			<div className="flex h-full min-h-0 flex-col">
				<div className="flex h-16 items-center border-b border-border px-6">
					<BrandMark />
				</div>

				<nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-6">
					<div>
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
										"group relative flex items-center rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
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
			</div>
		</AppSidebarFrame>
	);
}
