"use client";

import { Package } from "lucide-react";

export default function DashboardSidebar() {
	return (
		<aside className="w-64 bg-background border-r border-border min-h-screen">
			<div className="p-6">
				<div className="flex items-center space-x-2 mb-6">
					<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
						<Package className="w-5 h-5 text-white" />
					</div>
					<div>
						<div className="font-semibold text-sm">Painel Administrativo</div>
						<div className="text-xs text-muted-foreground truncate">
							Veja as opções de acesso
						</div>
					</div>
				</div>
			</div>
		</aside>
	);
}
