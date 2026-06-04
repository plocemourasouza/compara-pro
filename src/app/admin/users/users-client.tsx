"use client";

import {
	Building2,
	Calendar,
	Edit,
	Filter,
	Mail,
	Plus,
	RefreshCw,
	RotateCcw,
	Search,
	Trash2,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

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

interface UserData {
	id: string;
	name: string;
	email: string;
	role: "ADMIN" | "SUPPLIER" | "CLIENT";
	createdAt: string;
	updatedAt: string;
	deletedAt: string | null;
	company: {
		id: string;
		name: string;
		type: string;
	} | null;
}

interface UsersClientProps {
	user: User;
}

interface FormData {
	name: string;
	email: string;
	password: string;
	role: "ADMIN" | "SUPPLIER" | "CLIENT";
	companyName: string;
}

interface UserFilters {
	search: string;
	role: string;
	status: string;
}

const INITIAL_FORM_DATA: FormData = {
	name: "",
	email: "",
	password: "",
	role: "CLIENT",
	companyName: "",
};

const INITIAL_FILTERS: UserFilters = {
	search: "",
	role: "all",
	status: "active",
};

export default function UsersClient({ user: _user }: UsersClientProps) {
	// Estado principal
	const [users, setUsers] = useState<UserData[]>([]);
	const [loading, setLoading] = useState(true);
	const [actionLoading, setActionLoading] = useState(false);

	// Paginação
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const ITEMS_PER_PAGE = 10;

	// Filtros
	const [filters, setFilters] = useState<UserFilters>(INITIAL_FILTERS);

	// Modais
	const [createDialog, setCreateDialog] = useState(false);
	const [editDialog, setEditDialog] = useState(false);
	const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

	// Formulário
	const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

	// Carregar usuários quando filtros ou página mudarem
	// biome-ignore lint/correctness/useExhaustiveDependencies: mount-only fetch
	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const params = new URLSearchParams({
				page: page.toString(),
				limit: ITEMS_PER_PAGE.toString(),
				search: filters.search,
				role: filters.role,
				status: filters.status,
			});

			const response = await fetch(`/api/users?${params}`);

			if (!response.ok) {
				throw new Error("Erro ao carregar usuários");
			}

			const data = await response.json();
			setUsers(data.users || []);
			setTotalPages(data.pagination?.pages || 1);
			setTotal(data.pagination?.total || 0);
		} catch (error) {
			console.error("Erro ao carregar usuários:", error);
			toast.error("Não foi possível carregar os usuários");
		} finally {
			setLoading(false);
		}
	};

	const validateForm = (isEdit = false): boolean => {
		if (!formData.name.trim()) {
			toast.error("Nome é obrigatório");
			return false;
		}

		if (!formData.email.trim()) {
			toast.error("Email é obrigatório");
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.email)) {
			toast.error("Email inválido");
			return false;
		}

		if (!isEdit && !formData.password) {
			toast.error("Senha é obrigatória");
			return false;
		}

		if (formData.password && formData.password.length < 6) {
			toast.error("Senha deve ter pelo menos 6 caracteres");
			return false;
		}

		return true;
	};

	const handleCreateUser = async () => {
		if (!validateForm()) return;

		setActionLoading(true);
		try {
			const response = await fetch("/api/users", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao criar usuário");
			}

			toast.success("Usuário criado com sucesso");

			setCreateDialog(false);
			resetForm();
			await fetchUsers();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro de conexão");
		} finally {
			setActionLoading(false);
		}
	};

	const handleUpdateUser = async () => {
		if (!selectedUser || !validateForm(true)) return;

		setActionLoading(true);
		try {
			const updateData: Partial<FormData> = {
				name: formData.name,
				email: formData.email,
				role: formData.role,
			};

			if (formData.password) {
				updateData.password = formData.password;
			}

			const response = await fetch(`/api/users/${selectedUser.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updateData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao atualizar usuário");
			}

			toast.success("Usuário atualizado com sucesso");

			setEditDialog(false);
			setSelectedUser(null);
			resetForm();
			await fetchUsers();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro de conexão");
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteUser = async (userId: string) => {
		setActionLoading(true);
		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao desativar usuário");
			}

			toast.success("Usuário desativado com sucesso");

			await fetchUsers();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro de conexão");
		} finally {
			setActionLoading(false);
		}
	};

	const handleReactivateUser = async (userId: string) => {
		setActionLoading(true);
		try {
			const response = await fetch(`/api/users/${userId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action: "reactivate" }),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Erro ao reativar usuário");
			}

			toast.success("Usuário reativado com sucesso");

			await fetchUsers();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro de conexão");
		} finally {
			setActionLoading(false);
		}
	};

	const resetForm = () => {
		setFormData(INITIAL_FORM_DATA);
	};

	const openEditDialog = (userData: UserData) => {
		setSelectedUser(userData);
		setFormData({
			name: userData.name,
			email: userData.email,
			password: "",
			role: userData.role,
			companyName: userData.company?.name || "",
		});
		setEditDialog(true);
	};

	const updateFilters = (newFilters: Partial<UserFilters>) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
		setPage(1); // Reset para primeira página quando filtros mudarem
	};

	const getRoleLabel = (role: string): string => {
		const roleLabels = {
			ADMIN: "Administrador",
			SUPPLIER: "Fornecedor",
			CLIENT: "Cliente",
		};
		return roleLabels[role as keyof typeof roleLabels] || role;
	};

	const getRoleBadgeColor = (role: string): string => {
		const roleColors = {
			ADMIN: "bg-purple-100 text-purple-800",
			SUPPLIER: "bg-blue-100 text-blue-800",
			CLIENT: "bg-green-100 text-green-800",
		};
		return (
			roleColors[role as keyof typeof roleColors] || "bg-gray-100 text-gray-800"
		);
	};

	const formatDate = (dateString: string): string => {
		return new Intl.DateTimeFormat("pt-BR", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		}).format(new Date(dateString));
	};

	const getUserInitials = (name: string): string => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-center">
					<RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
					<p>Carregando usuários...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<h1 className="text-3xl font-bold">Gestão de Usuários</h1>
					<p className="text-muted-foreground">
						Gerencie todos os usuários do sistema
					</p>
				</div>

				<Dialog open={createDialog} onOpenChange={setCreateDialog}>
					<DialogTrigger asChild>
						<Button onClick={resetForm}>
							<Plus className="h-4 w-4 mr-2" />
							Novo Usuário
						</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Criar Novo Usuário</DialogTitle>
						</DialogHeader>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nome Completo *</Label>
								<Input
									id="name"
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									placeholder="Nome do usuário"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									type="email"
									value={formData.email}
									onChange={(e) =>
										setFormData({ ...formData, email: e.target.value })
									}
									placeholder="email@exemplo.com"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="password">Senha *</Label>
								<Input
									id="password"
									type="password"
									value={formData.password}
									onChange={(e) =>
										setFormData({ ...formData, password: e.target.value })
									}
									placeholder="Mínimo 6 caracteres"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="role">Papel</Label>
								<Select
									value={formData.role}
									onValueChange={(value: "ADMIN" | "SUPPLIER" | "CLIENT") =>
										setFormData({ ...formData, role: value })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="CLIENT">Cliente</SelectItem>
										<SelectItem value="SUPPLIER">Fornecedor</SelectItem>
										<SelectItem value="ADMIN">Administrador</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{formData.role !== "ADMIN" && (
								<div className="space-y-2">
									<Label htmlFor="companyName">Nome da Empresa</Label>
									<Input
										id="companyName"
										value={formData.companyName}
										onChange={(e) =>
											setFormData({ ...formData, companyName: e.target.value })
										}
										placeholder="Nome da empresa"
									/>
								</div>
							)}
						</div>
						<DialogFooter>
							<Button variant="outline" onClick={() => setCreateDialog(false)}>
								Cancelar
							</Button>
							<Button onClick={handleCreateUser} disabled={actionLoading}>
								{actionLoading ? "Criando..." : "Criar Usuário"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			{/* Filtros */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Filter className="h-5 w-5" />
							Filtros
						</div>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Users className="h-4 w-4" />
							{total} usuários
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label htmlFor="search">Buscar</Label>
							<div className="relative">
								<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Nome ou email..."
									value={filters.search}
									onChange={(e) => updateFilters({ search: e.target.value })}
									className="pl-9"
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="role">Papel</Label>
							<Select
								value={filters.role}
								onValueChange={(value) => updateFilters({ role: value })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todos</SelectItem>
									<SelectItem value="ADMIN">Administrador</SelectItem>
									<SelectItem value="SUPPLIER">Fornecedor</SelectItem>
									<SelectItem value="CLIENT">Cliente</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select
								value={filters.status}
								onValueChange={(value) => updateFilters({ status: value })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="active">Ativos</SelectItem>
									<SelectItem value="inactive">Inativos</SelectItem>
									<SelectItem value="all">Todos</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Lista de Usuários */}
			<div className="space-y-4">
				{users.length === 0 ? (
					<Card>
						<CardContent className="p-8 text-center">
							<Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
							<h3 className="text-lg font-medium mb-2">
								Nenhum usuário encontrado
							</h3>
							<p className="text-muted-foreground">
								Não há usuários que correspondam aos filtros aplicados.
							</p>
						</CardContent>
					</Card>
				) : (
					users.map((userData) => (
						<Card
							key={userData.id}
							className={userData.deletedAt ? "opacity-60" : ""}
						>
							<CardContent className="p-6">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-4">
										<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
											<span className="text-blue-600 font-medium">
												{getUserInitials(userData.name)}
											</span>
										</div>

										<div className="space-y-1">
											<div className="flex items-center gap-2">
												<h3 className="font-semibold">{userData.name}</h3>
												<Badge className={getRoleBadgeColor(userData.role)}>
													{getRoleLabel(userData.role)}
												</Badge>
												{userData.deletedAt ? (
													<Badge variant="destructive">Inativo</Badge>
												) : (
													<Badge variant="secondary">Ativo</Badge>
												)}
											</div>

											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												<div className="flex items-center gap-1">
													<Mail className="h-4 w-4" />
													{userData.email}
												</div>
												{userData.company && (
													<div className="flex items-center gap-1">
														<Building2 className="h-4 w-4" />
														{userData.company.name}
													</div>
												)}
												<div className="flex items-center gap-1">
													<Calendar className="h-4 w-4" />
													{formatDate(userData.createdAt)}
												</div>
											</div>
										</div>
									</div>

									<div className="flex items-center gap-2">
										{!userData.deletedAt ? (
											<>
												<Button
													variant="outline"
													size="sm"
													onClick={() => openEditDialog(userData)}
												>
													<Edit className="h-4 w-4 mr-2" />
													Editar
												</Button>

												<AlertDialog>
													<AlertDialogTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															className="text-red-600"
														>
															<Trash2 className="h-4 w-4 mr-2" />
															Desativar
														</Button>
													</AlertDialogTrigger>
													<AlertDialogContent>
														<AlertDialogHeader>
															<AlertDialogTitle>
																Desativar Usuário
															</AlertDialogTitle>
															<AlertDialogDescription>
																Tem certeza que deseja desativar o usuário{" "}
																{userData.name}? Esta ação pode ser revertida
																posteriormente.
															</AlertDialogDescription>
														</AlertDialogHeader>
														<AlertDialogFooter>
															<AlertDialogCancel>Cancelar</AlertDialogCancel>
															<AlertDialogAction
																onClick={() => handleDeleteUser(userData.id)}
																className="bg-red-600 hover:bg-red-700"
																disabled={actionLoading}
															>
																{actionLoading ? "Desativando..." : "Desativar"}
															</AlertDialogAction>
														</AlertDialogFooter>
													</AlertDialogContent>
												</AlertDialog>
											</>
										) : (
											<AlertDialog>
												<AlertDialogTrigger asChild>
													<Button
														variant="outline"
														size="sm"
														className="text-green-600"
													>
														<RotateCcw className="h-4 w-4 mr-2" />
														Reativar
													</Button>
												</AlertDialogTrigger>
												<AlertDialogContent>
													<AlertDialogHeader>
														<AlertDialogTitle>
															Reativar Usuário
														</AlertDialogTitle>
														<AlertDialogDescription>
															Tem certeza que deseja reativar o usuário{" "}
															{userData.name}?
														</AlertDialogDescription>
													</AlertDialogHeader>
													<AlertDialogFooter>
														<AlertDialogCancel>Cancelar</AlertDialogCancel>
														<AlertDialogAction
															onClick={() => handleReactivateUser(userData.id)}
															className="bg-green-600 hover:bg-green-700"
															disabled={actionLoading}
														>
															{actionLoading ? "Reativando..." : "Reativar"}
														</AlertDialogAction>
													</AlertDialogFooter>
												</AlertDialogContent>
											</AlertDialog>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					))
				)}
			</div>

			{/* Paginação */}
			{totalPages > 1 && (
				<div className="flex justify-center items-center gap-2">
					<Button
						variant="outline"
						onClick={() => setPage((p) => Math.max(1, p - 1))}
						disabled={page === 1}
					>
						Anterior
					</Button>
					<span className="text-sm text-muted-foreground">
						Página {page} de {totalPages}
					</span>
					<Button
						variant="outline"
						onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
						disabled={page === totalPages}
					>
						Próxima
					</Button>
				</div>
			)}

			{/* Modal de Edição */}
			<Dialog open={editDialog} onOpenChange={setEditDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Usuário</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="edit-name">Nome Completo *</Label>
							<Input
								id="edit-name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-email">Email *</Label>
							<Input
								id="edit-email"
								type="email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-password">Nova Senha (opcional)</Label>
							<Input
								id="edit-password"
								type="password"
								value={formData.password}
								onChange={(e) =>
									setFormData({ ...formData, password: e.target.value })
								}
								placeholder="Deixe vazio para manter a atual"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="edit-role">Papel</Label>
							<Select
								value={formData.role}
								onValueChange={(value: "ADMIN" | "SUPPLIER" | "CLIENT") =>
									setFormData({ ...formData, role: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="CLIENT">Cliente</SelectItem>
									<SelectItem value="SUPPLIER">Fornecedor</SelectItem>
									<SelectItem value="ADMIN">Administrador</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditDialog(false)}>
							Cancelar
						</Button>
						<Button onClick={handleUpdateUser} disabled={actionLoading}>
							{actionLoading ? "Salvando..." : "Salvar Alterações"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
