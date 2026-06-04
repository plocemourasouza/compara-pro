"use client";

import { Bell, CheckCircle, LogOut, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

interface DashboardUser {
	id: string;
	name: string;
	email: string;
	role: string;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
}

interface DashboardHeaderProps {
	user: DashboardUser;
}

interface Notification {
	id: string;
	type: string;
	title: string;
	message: string;
	read: boolean;
	createdAt: string;
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [notificationsOpen, setNotificationsOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch + interval
	useEffect(() => {
		fetchNotifications();
		// Poll for new notifications every 30 seconds
		const interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	}, []);

	const fetchNotifications = async () => {
		try {
			const response = await fetch("/api/notifications?limit=10");
			if (response.ok) {
				const data = await response.json();
				setNotifications(data.notifications);
				setUnreadCount(data.unreadCount);
			}
		} catch (error) {
			console.error("Fetch notifications error:", error);
		}
	};

	const markAsRead = async (notificationId: string) => {
		try {
			const response = await fetch(
				`/api/notifications/${notificationId}/read`,
				{
					method: "PUT",
				},
			);
			if (response.ok) {
				setNotifications((prev) =>
					prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
				);
				setUnreadCount((prev) => Math.max(0, prev - 1));
			}
		} catch (error) {
			console.error("Mark as read error:", error);
		}
	};

	const markAllAsRead = async () => {
		try {
			const response = await fetch("/api/notifications/mark-all-read", {
				method: "PUT",
			});
			if (response.ok) {
				setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
				setUnreadCount(0);
			}
		} catch (error) {
			console.error("Mark all as read error:", error);
		}
	};

	const handleLogout = () => {
		// Remove token and redirect
		// biome-ignore lint/suspicious/noDocumentCookie: clears the auth_token cookie on logout
		document.cookie = "auth_token=; Max-Age=0; path=/";
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		window.location.href = "/auth/login";
	};

	const handleNotificationKeyDown = (
		event: React.KeyboardEvent,
		notificationId: string,
	) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			const notification = notifications.find((n) => n.id === notificationId);
			if (notification && !notification.read) {
				markAsRead(notificationId);
			}
		}
	};

	const formatTimeAgo = (dateString: string) => {
		const date = new Date(dateString);
		const now = new Date();
		const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

		if (diffInMinutes < 1) return "Agora";
		if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;

		const diffInHours = Math.floor(diffInMinutes / 60);
		if (diffInHours < 24) return `${diffInHours}h atrás`;

		const diffInDays = Math.floor(diffInHours / 24);
		return `${diffInDays}d atrás`;
	};

	return (
		<header className="bg-white border-b border-gray-200 px-6 py-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<h1 className="text-xl font-semibold text-gray-900">
						Price Comparison Platform
					</h1>
				</div>

				<div className="flex items-center space-x-4">
					{/* Notifications */}
					<Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="sm" className="relative">
								<Bell className="h-5 w-5" />
								{unreadCount > 0 && (
									<Badge
										variant="destructive"
										className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center"
									>
										{unreadCount > 99 ? "99+" : unreadCount}
									</Badge>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80 p-0" align="end">
							<div className="p-4 border-b">
								<div className="flex items-center justify-between">
									<h4 className="font-semibold">Notificações</h4>
									{unreadCount > 0 && (
										<Button
											variant="ghost"
											size="sm"
											onClick={markAllAsRead}
											className="text-xs"
										>
											<CheckCircle className="h-4 w-4 mr-1" />
											Marcar todas como lidas
										</Button>
									)}
								</div>
							</div>
							<div className="max-h-96 overflow-y-auto">
								{notifications.length === 0 ? (
									<div className="p-4 text-center text-gray-500">
										<Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
										<p>Nenhuma notificação</p>
									</div>
								) : (
									notifications.map((notification) => (
										<button
											key={notification.id}
											type="button"
											className={`p-4 border-b hover:bg-gray-50 cursor-pointer w-full text-left ${
												!notification.read ? "bg-blue-50" : ""
											}`}
											onClick={() => {
												if (!notification.read) {
													markAsRead(notification.id);
												}
											}}
											onKeyDown={(event) =>
												handleNotificationKeyDown(event, notification.id)
											}
											aria-pressed={!notification.read}
										>
											<div className="flex justify-between items-start">
												<div className="flex-1 mr-2">
													<h5 className="font-medium text-sm">
														{notification.title}
													</h5>
													<p className="text-sm text-gray-600 mt-1">
														{notification.message}
													</p>
													<p className="text-xs text-gray-500 mt-2">
														{formatTimeAgo(notification.createdAt)}
													</p>
												</div>
												{!notification.read && (
													<div className="w-2 h-2 bg-blue-500 rounded-full mt-1" />
												)}
											</div>
										</button>
									))
								)}
							</div>
						</PopoverContent>
					</Popover>

					{/* User Menu */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="flex items-center space-x-2">
								<Avatar className="h-8 w-8">
									<AvatarFallback>
										{user.name
											.split(" ")
											.map((n) => n[0])
											.join("")
											.toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div className="text-left">
									<div className="text-sm font-medium">{user.name}</div>
									<div className="text-xs text-gray-500">
										{user.company?.name}
									</div>
								</div>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							<DropdownMenuItem>
								<User className="mr-2 h-4 w-4" />
								<span>Perfil</span>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<Settings className="mr-2 h-4 w-4" />
								<span>Configurações</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={handleLogout} className="text-red-600">
								<LogOut className="mr-2 h-4 w-4" />
								<span>Sair</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
