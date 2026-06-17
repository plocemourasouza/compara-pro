"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";
import { MaskedInput } from "@/components/shared/masked-input";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { AccessRole } from "@/lib/services/user-access";
import {
	createUserFormSchema,
	type UserFormValues,
	updateUserFormSchema,
} from "@/lib/validations/user";

const ROLE_LABELS: Record<AccessRole, string> = {
	ADMIN: "Administrador",
	REPRESENTATIVE: "Representante",
	CLIENT: "Cliente",
};

const EMPTY_DEFAULTS: UserFormValues = {
	name: "",
	email: "",
	phone: "",
	role: "CLIENT",
	companyName: "",
};

interface UserFormProps {
	mode: "create" | "edit";
	userId?: string;
	defaultValues?: Partial<UserFormValues>;
	/** Papel da área/sessão — implícito (sem dropdown). */
	scopeRole: AccessRole;
	/** Ator é ADMIN? Define se o campo Empresa aparece (admin precisa informar). */
	actorIsAdmin: boolean;
	/** Rota de volta após salvar/cancelar. */
	returnTo: string;
}

export function UserForm({
	mode,
	userId,
	defaultValues,
	scopeRole,
	actorIsAdmin,
	returnTo,
}: UserFormProps) {
	const router = useRouter();
	const isEdit = mode === "edit";
	const form = useForm<UserFormValues>({
		resolver: zodResolver(
			isEdit ? updateUserFormSchema : createUserFormSchema,
		) as Resolver<UserFormValues>,
		defaultValues: { ...EMPTY_DEFAULTS, role: scopeRole, ...defaultValues },
	});

	// Empresa só quando ADMIN cria não-admin (admin não tem empresa própria).
	// Representante/cliente em autoatendimento: empresa = a própria (implícita).
	const showCompanyField = !isEdit && actorIsAdmin && scopeRole !== "ADMIN";

	const onSubmit = async (values: UserFormValues) => {
		// Admin criando não-admin: empresa é obrigatória (admin não tem própria).
		if (showCompanyField && !values.companyName?.trim()) {
			form.setError("companyName", { message: "Empresa é obrigatória" });
			return;
		}

		const url = isEdit
			? `/api/users/${userId}`
			: `/api/users?scopeRole=${scopeRole}`;
		const method = isEdit ? "PUT" : "POST";
		const body = isEdit
			? {
					name: values.name,
					email: values.email,
					phone: values.phone,
				}
			: {
					name: values.name,
					email: values.email,
					phone: values.phone,
					role: scopeRole,
					...(showCompanyField && values.companyName
						? { companyName: values.companyName }
						: {}),
				};

		try {
			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (response.ok) {
				if (isEdit) {
					toast.success("Usuário atualizado com sucesso!");
				} else {
					const created = await response.json();
					const code = created.activation?.code;
					toast.success("Usuário criado com sucesso!", {
						description: code
							? `Código de primeiro acesso: ${code} — envie ao usuário (link: ${created.activation.link}).`
							: undefined,
						duration: 20000,
					});
				}
				router.push(returnTo);
				router.refresh();
				return;
			}

			const data = await response.json();
			if (Array.isArray(data.details)) {
				for (const issue of data.details) {
					const field = issue.path?.[0];
					if (field) {
						form.setError(field as keyof UserFormValues, {
							message: issue.message,
						});
					}
				}
			}
			toast.error(data.error || "Erro ao salvar usuário");
		} catch (error) {
			console.error("Error saving user:", error);
			toast.error("Erro ao salvar usuário");
		}
	};

	const isSubmitting = form.formState.isSubmitting;

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{isEdit ? "Editar Usuário" : "Criar Novo Usuário"}
					</h1>
					<p className="text-muted-foreground">
						{isEdit
							? "Atualize os dados do usuário"
							: "Preencha os dados para criar um usuário"}
					</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Dados do Usuário</CardTitle>
							<CardDescription>
								Dados de contato e nível de permissão. A senha é definida pelo
								próprio usuário no primeiro acesso.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Nome Completo *</FormLabel>
										<FormControl>
											<Input placeholder="Nome do usuário" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email *</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="email@exemplo.com"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="phone"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Telefone *</FormLabel>
										<FormControl>
											<MaskedInput
												mask="phone"
												placeholder="(11) 99999-9999"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{/* Papel é implícito pela sessão — somente leitura. */}
							<div className="space-y-2">
								<span className="text-sm font-medium leading-none">Papel</span>
								<Input
									value={ROLE_LABELS[scopeRole]}
									disabled
									readOnly
									aria-label="Papel"
								/>
							</div>
							{showCompanyField && (
								<FormField
									control={form.control}
									name="companyName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nome da Empresa *</FormLabel>
											<FormControl>
												<Input placeholder="Nome da empresa" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</CardContent>
					</Card>

					<Separator />

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push(returnTo)}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							<Save className="mr-2 h-4 w-4" />
							{isSubmitting
								? "Salvando..."
								: isEdit
									? "Salvar Alterações"
									: "Criar Usuário"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
