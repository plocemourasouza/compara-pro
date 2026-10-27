"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AppSidebarFrameProps {
	children: React.ReactNode;
}

/** Sidebar fixa a partir de lg. Abaixo disso, abre por cima do conteúdo. */
export function AppSidebarFrame({ children }: AppSidebarFrameProps) {
	const pathname = usePathname();
	return <SidebarPanel key={pathname}>{children}</SidebarPanel>;
}

function SidebarPanel({ children }: AppSidebarFrameProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="fixed top-3 left-3 z-40 lg:hidden"
				aria-label="Abrir menu"
				aria-expanded={open}
				onClick={() => setOpen(true)}
			>
				<Menu className="h-5 w-5" />
			</Button>
			{open && (
				<button
					type="button"
					className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
					aria-label="Fechar menu"
					onClick={() => setOpen(false)}
				/>
			)}
			<div
				className={cn(
					"fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform",
					open
						? "translate-x-0"
						: "max-lg:-translate-x-full max-lg:invisible lg:translate-x-0 lg:visible",
				)}
			>
				{children}
			</div>
		</>
	);
}
