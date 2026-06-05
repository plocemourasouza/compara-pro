"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
	type ProductFormValues,
	productFormSchema,
} from "@/lib/validations/product";

interface CompanyOption {
	id: string;
	name: string;
	type: string;
}

interface ProductFormProps {
	mode: "create" | "edit";
	productId?: string;
	/** When true, render the company selector (ADMIN). */
	isAdmin: boolean;
	/** Companies for the ADMIN selector. */
	companies?: CompanyOption[];
	/** Where to return after submit / cancel. */
	listHref: string;
	defaultValues?: Partial<ProductFormValues>;
}

const EMPTY_DEFAULTS: ProductFormValues = {
	code: "",
	sku: "",
	name: "",
	price: "",
	description: "",
	category: "",
	unit: "",
	companyId: "",
};

export function ProductForm({
	mode,
	productId,
	isAdmin,
	companies = [],
	listHref,
	defaultValues,
}: ProductFormProps) {
	const router = useRouter();
	const isEdit = mode === "edit";
	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
	});

	const onSubmit = async (values: ProductFormValues) => {
		const url = isEdit ? `/api/products/${productId}` : "/api/products";
		const method = isEdit ? "PUT" : "POST";
		const body = {
			code: values.code || undefined,
			sku: values.sku || undefined,
			name: values.name,
			price: values.price ? Number.parseFloat(values.price) : undefined,
			description: values.description || undefined,
			category: values.category || undefined,
			unit: values.unit || undefined,
			companyId: values.companyId,
		};

		try {
			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (response.ok) {
				toast.success(
					isEdit
						? "Produto atualizado com sucesso!"
						: "Produto criado com sucesso!",
				);
				router.push(listHref);
				router.refresh();
				return;
			}

			const data = await response.json();
			if (Array.isArray(data.details)) {
				for (const issue of data.details) {
					const field = issue.path?.[0];
					if (field) {
						form.setError(field as keyof ProductFormValues, {
							message: issue.message,
						});
					}
				}
			}
			toast.error(data.error || "Erro ao salvar produto");
		} catch (error) {
			console.error("Error saving product:", error);
			toast.error("Erro ao salvar produto");
		}
	};

	const isSubmitting = form.formState.isSubmitting;

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						{isEdit ? "Editar Produto" : "Criar Novo Produto"}
					</h1>
					<p className="text-muted-foreground">
						{isEdit
							? "Atualize os dados do produto"
							: "Preencha os dados para criar um produto"}
					</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Dados do Produto</CardTitle>
							<CardDescription>
								Informações de catálogo e precificação.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>Código</FormLabel>
										<FormControl>
											<Input placeholder="Código do produto" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="sku"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>SKU</FormLabel>
										<FormControl>
											<Input placeholder="SKU do produto" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem className="sm:col-span-6">
										<FormLabel>Nome do Produto *</FormLabel>
										<FormControl>
											<Input placeholder="Nome do produto" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="price"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Preço</FormLabel>
										<FormControl>
											<Input
												type="number"
												step="0.01"
												placeholder="0.00"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="unit"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Unidade</FormLabel>
										<FormControl>
											<Input placeholder="Unidade (kg, l, etc)" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="category"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Categoria</FormLabel>
										<FormControl>
											<Input placeholder="Categoria do produto" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem className="sm:col-span-6">
										<FormLabel>Descrição</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Descrição do produto"
												rows={3}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{isAdmin && (
								<FormField
									control={form.control}
									name="companyId"
									render={({ field }) => (
										<FormItem className="sm:col-span-6">
											<FormLabel>Empresa *</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Selecione uma empresa" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{companies.map((company) => (
														<SelectItem key={company.id} value={company.id}>
															{company.name} (
															{company.type === "SUPPLIER"
																? "Fornecedor"
																: "Cliente"}
															)
														</SelectItem>
													))}
												</SelectContent>
											</Select>
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
							onClick={() => router.push(listHref)}
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
									: "Criar Produto"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
