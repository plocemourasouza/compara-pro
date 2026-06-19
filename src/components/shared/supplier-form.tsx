"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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
import {
	type SupplierCompanyValues,
	supplierCompanySchema,
} from "@/lib/validations/representative";

interface SupplierFormProps {
	mode: "create" | "edit";
	supplierId?: string;
	/** Where to return after submit / cancel. */
	listHref: string;
	defaultValues?: Partial<SupplierCompanyValues>;
}

const EMPTY_DEFAULTS: SupplierCompanyValues = {
	name: "",
	cnpj: "",
	city: "",
	state: "",
};

export function SupplierForm({
	mode,
	supplierId,
	listHref,
	defaultValues,
}: SupplierFormProps) {
	const router = useRouter();
	const isEdit = mode === "edit";
	const form = useForm<SupplierCompanyValues>({
		resolver: zodResolver(supplierCompanySchema),
		defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
	});

	const onSubmit = async (values: SupplierCompanyValues) => {
		const url = isEdit
			? `/api/representative/suppliers/${supplierId}`
			: "/api/representative/suppliers";
		try {
			const res = await fetch(url, {
				method: isEdit ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			if (res.ok) {
				toast.success(
					isEdit ? "Fornecedor atualizado." : "Fornecedor cadastrado.",
				);
				router.push(listHref);
				router.refresh();
				return;
			}
			const data = await res.json();
			toast.error(data.error ?? "Erro ao salvar fornecedor");
		} catch (error) {
			console.error("Error saving supplier:", error);
			toast.error("Erro ao salvar fornecedor");
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
					<h1 className="font-bold text-2xl tracking-tight">
						{isEdit ? "Editar fornecedor" : "Novo fornecedor"}
					</h1>
					<p className="text-muted-foreground">
						{isEdit
							? "Atualize os dados da empresa fornecedora."
							: "Cadastre a empresa fornecedora que você representa."}
					</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Dados do Fornecedor</CardTitle>
							<CardDescription>
								Cada lista de preços é enviada em nome de um fornecedor.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem className="sm:col-span-4">
										<FormLabel>Nome do Fornecedor *</FormLabel>
										<FormControl>
											<Input placeholder="Nome fantasia" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="cnpj"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>CNPJ</FormLabel>
										<FormControl>
											<MaskedInput
												mask="cnpj"
												placeholder="00.000.000/0000-00"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="city"
								render={({ field }) => (
									<FormItem className="sm:col-span-4">
										<FormLabel>Cidade</FormLabel>
										<FormControl>
											<Input placeholder="Cidade" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="state"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>UF</FormLabel>
										<FormControl>
											<Input
												placeholder="UF"
												maxLength={2}
												{...field}
												onChange={(e) =>
													field.onChange(e.target.value.toUpperCase())
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
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
									: "Cadastrar"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
