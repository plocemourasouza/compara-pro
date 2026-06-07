"use client";

import { motion } from "framer-motion";
import {
	Bell,
	CheckCheck,
	CheckCircle2,
	FileWarning,
	Info,
	ShoppingCart,
	XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatters } from "@/lib/utils/masks";

interface NotificationItem {
	id: string;
	type: string;
	title: string;
	message: string;
	read: boolean;
	createdAt: string;
}

const ICONS: Record<string, typeof Bell> = {
	PRE_ORDER_APPROVED: CheckCircle2,
	PRE_ORDER_REJECTED: XCircle,
	UPLOAD_COMPLETED: CheckCircle2,
	UPLOAD_FAILED: FileWarning,
	COMPARISON_COMPLETED: ShoppingCart,
	MATCH_CREATED: ShoppingCart,
	SYSTEM_UPDATE: Info,
};

export default function NotificationsClient() {
	const [items, setItems] = useState<NotificationItem[]>([]);
	const [unread, setUnread] = useState(0);
	const [loading, setLoading] = useState(true);

	const load = useCallback(() => {
		setLoading(true);
		fetch("/api/notifications?limit=50")
			.then((r) => (r.ok ? r.json() : Promise.reject(r)))
			.then((d) => {
				setItems(d.notifications);
				setUnread(d.unreadCount);
			})
			.catch(() => toast.error("Não foi possível carregar as notificações."))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const markRead = async (id: string) => {
		const item = items.find((n) => n.id === id);
		if (!item || item.read) return;
		setItems((prev) =>
			prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
		);
		setUnread((u) => Math.max(0, u - 1));
		await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
	};

	const markAll = async () => {
		setItems((prev) => prev.map((n) => ({ ...n, read: true })));
		setUnread(0);
		const res = await fetch("/api/notifications/mark-all-read", {
			method: "PUT",
		});
		if (res.ok) toast.success("Todas marcadas como lidas.");
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-2xl tracking-tight">Notificações</h1>
					<p className="text-muted-foreground">
						{unread > 0 ? `${unread} não lida(s)` : "Tudo em dia."}
					</p>
				</div>
				<Button variant="outline" onClick={markAll} disabled={unread === 0}>
					<CheckCheck className="mr-2 h-4 w-4" />
					Marcar todas como lidas
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Atividade</CardTitle>
					<CardDescription>
						Pré-pedidos, uploads e avisos do sistema.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<p className="text-muted-foreground text-sm">Carregando…</p>
					) : items.length === 0 ? (
						<div className="py-12 text-center text-muted-foreground text-sm">
							<Bell className="mx-auto mb-2 h-8 w-8 opacity-40" />
							Nenhuma notificação.
						</div>
					) : (
						<motion.ul
							className="divide-y"
							initial="hidden"
							animate="show"
							variants={{
								hidden: {},
								show: { transition: { staggerChildren: 0.04 } },
							}}
						>
							{items.map((n) => {
								const Icon = ICONS[n.type] ?? Bell;
								return (
									<motion.li
										key={n.id}
										layout
										variants={{
											hidden: { opacity: 0, x: -8 },
											show: { opacity: 1, x: 0 },
										}}
									>
										<button
											type="button"
											onClick={() => markRead(n.id)}
											className={cn(
												"flex w-full items-start gap-3 py-3 text-left transition-colors hover:bg-muted/50",
												!n.read && "bg-primary/5",
											)}
										>
											<span
												className={cn(
													"mt-0.5 rounded-full p-1.5",
													n.read
														? "bg-muted text-muted-foreground"
														: "bg-primary/10 text-primary",
												)}
											>
												<Icon className="h-4 w-4" />
											</span>
											<div className="min-w-0 flex-1">
												<div className="flex items-center gap-2">
													<p className="font-medium text-sm">{n.title}</p>
													{!n.read && (
														<motion.span
															className="h-2 w-2 shrink-0 rounded-full bg-primary"
															animate={{
																scale: [1, 1.4, 1],
																opacity: [1, 0.6, 1],
															}}
															transition={{
																duration: 1.6,
																repeat: Number.POSITIVE_INFINITY,
															}}
														/>
													)}
												</div>
												<p className="text-muted-foreground text-sm">
													{n.message}
												</p>
												<p className="text-muted-foreground text-xs">
													{formatters.datetime(n.createdAt)}
												</p>
											</div>
										</button>
									</motion.li>
								);
							})}
						</motion.ul>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
