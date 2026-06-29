"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MaskedInput } from "@/components/shared/masked-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { masks } from "@/lib/utils/masks";
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
	/** Admin escolhe a agência (representante) dona do vínculo no cadastro. */
	isAdmin?: boolean;
	agencies?: { id: string; name: string }[];
}

const EMPTY_DEFAULTS: SupplierCompanyValues = {
	name: "",
	legalName: "",
	cnpj: "",
	zipCode: "",
	street: "",
	number: "",
	neighborhood: "",
	city: "",
	state: "",
	email: "",
	phone: "",
	responsibleName: "",
	responsibleEmail: "",
	responsiblePhone: "",
	representativeCompanyId: "",
};

export function SupplierForm({
	mode,
	supplierId,
	listHref,
	defaultValues,
	isAdmin = false,
	agencies = [],
}: SupplierFormProps) {
	const router = useRouter();
	const isEdit = mode === "edit";
	const form = useForm<SupplierCompanyValues>({
		resolver: zodResolver(supplierCompanySchema),
		defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
	});

	const [cnpjLoading, setCnpjLoading] = useState(false);
	const [cepLoading, setCepLoading] = useState(false);
	const lastCnpj = useRef("");
	const lastCep = useRef("");

	const setVal = (field: keyof SupplierCompanyValues, value?: string) => {
		if (value !== undefined)
			form.setValue(field, value, { shouldValidate: true, shouldDirty: true });
	};

	const runCnpjLookup = async (masked: string) => {
		const digits = masked.replace(/\D/g, "");
		if (isEdit || digits.length !== 14 || digits === lastCnpj.current) return;
		lastCnpj.current = digits;
		setCnpjLoading(true);
		try {
			const res = await fetch(`/api/lookup/cnpj/${digits}`);
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "Não foi possível buscar o CNPJ.");
				return;
			}
			setVal("name", data.name);
			setVal("legalName", data.legalName);
			setVal("email", data.email);
			if (data.phone) setVal("phone", masks.phone(data.phone));
			setVal("responsibleName", data.responsibleName);
			if (data.email) setVal("responsibleEmail", data.email);
			if (data.phone) setVal("responsiblePhone", masks.phone(data.phone));
			const a = data.address ?? {};
			if (a.zipCode) setVal("zipCode", masks.cep(a.zipCode));
			setVal("street", a.street);
			setVal("number", a.number);
			setVal("neighborhood", a.neighborhood);
			setVal("city", a.city);
			setVal("state", a.state);
			toast.success("Dados preenchidos a partir do CNPJ.");
		} catch {
			toast.error("Não foi possível buscar o CNPJ.");
		} finally {
			setCnpjLoading(false);
		}
	};

	const runCepLookup = async (masked: string) => {
		const digits = masked.replace(/\D/g, "");
		if (digits.length !== 8 || digits === lastCep.current) return;
		lastCep.current = digits;
		setCepLoading(true);
		try {
			const res = await fetch(`/api/lookup/cep/${digits}`);
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "Não foi possível buscar o CEP.");
				return;
			}
			setVal("street", data.street);
			setVal("neighborhood", data.neighborhood);
			setVal("city", data.city);
			setVal("state", data.state);
			toast.success("Endereço preenchido a partir do CEP.");
		} catch {
			toast.error("Não foi possível buscar o CEP.");
		} finally {
			setCepLoading(false);
		}
	};

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
		<div className="mx-auto max-w-3xl space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" aria-hidden="true" />
				</Button>
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						{isEdit ? "Editar fornecedor" : "Novo fornecedor"}
					</h1>
					<p className="text-muted-foreground">
						{isEdit
							? "Atualize os dados da empresa fornecedora."
							: "Informe o CNPJ para preencher automaticamente os dados."}
					</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Empresa fornecedora</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							{isAdmin && !isEdit && (
								<FormField
									control={form.control}
									name="representativeCompanyId"
									render={({ field }) => (
										<FormItem className="sm:col-span-6">
											<FormLabel>Agência (representante) *</FormLabel>
											<Select
												value={field.value}
												onValueChange={field.onChange}
											>
												<FormControl>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Qual agência representa este fornecedor?" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{agencies.map((a) => (
														<SelectItem key={a.id} value={a.id}>
															{a.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
							<FormField
								control={form.control}
								name="cnpj"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>CNPJ</FormLabel>
										<div className="relative">
											<FormControl>
												<MaskedInput
													mask="cnpj"
													placeholder="00.000.000/0000-00"
													value={field.value ?? ""}
													disabled={isEdit}
													onChange={(v) => {
														field.onChange(v);
														runCnpjLookup(v);
													}}
												/>
											</FormControl>
											{cnpjLoading && (
												<Loader2
													className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground"
													aria-hidden="true"
												/>
											)}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
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
								name="legalName"
								render={({ field }) => (
									<FormItem className="sm:col-span-6">
										<FormLabel>Razão social</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="zipCode"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>CEP</FormLabel>
										<div className="relative">
											<FormControl>
												<MaskedInput
													mask="cep"
													placeholder="00000-000"
													value={field.value ?? ""}
													onChange={(v) => {
														field.onChange(v);
														runCepLookup(v);
													}}
												/>
											</FormControl>
											{cepLoading && (
												<Loader2
													className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground"
													aria-hidden="true"
												/>
											)}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="street"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>Endereço</FormLabel>
										<FormControl>
											<Input placeholder="Logradouro" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="number"
								render={({ field }) => (
									<FormItem className="sm:col-span-1">
										<FormLabel>Número</FormLabel>
										<FormControl>
											<Input placeholder="Nº" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="neighborhood"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>Bairro</FormLabel>
										<FormControl>
											<Input placeholder="Bairro" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="city"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
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
									<FormItem className="sm:col-span-1">
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

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Responsável (contato)</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="responsibleName"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Responsável</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="responsibleEmail"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>E-mail</FormLabel>
										<FormControl>
											<Input type="email" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="responsiblePhone"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Telefone</FormLabel>
										<FormControl>
											<MaskedInput
												mask="phone"
												placeholder="(00) 00000-0000"
												value={field.value ?? ""}
												onChange={field.onChange}
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
							<Save className="mr-2 h-4 w-4" aria-hidden="true" />
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
