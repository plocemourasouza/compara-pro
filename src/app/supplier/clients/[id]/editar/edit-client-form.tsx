"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { masks } from "@/lib/utils/masks";

const schema = z.object({
	name: z.string().min(2, "Informe o nome da empresa"),
	cnpj: z.string().optional(),
	zipCode: z.string().optional(),
	street: z.string().optional(),
	number: z.string().optional(),
	neighborhood: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	responsibleName: z.string().min(2, "Informe o responsável"),
	responsibleEmail: z.string().email("E-mail inválido"),
	responsiblePhone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface EditClientFormProps {
	clientId: string;
	defaultValues: FormValues;
}

export default function EditClientForm({
	clientId,
	defaultValues,
}: EditClientFormProps) {
	const router = useRouter();
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues,
	});
	const [cnpjLoading, setCnpjLoading] = useState(false);
	const [cepLoading, setCepLoading] = useState(false);
	const lastCnpj = useRef("");
	const lastCep = useRef("");

	const setVal = (field: keyof FormValues, value?: string) => {
		if (value !== undefined)
			form.setValue(field, value, { shouldValidate: true, shouldDirty: true });
	};

	const runCnpjLookup = async (masked: string) => {
		const digits = masked.replace(/\D/g, "");
		if (digits.length !== 14 || digits === lastCnpj.current) return;
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
			if (data.responsibleName) setVal("responsibleName", data.responsibleName);
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

	const onSubmit = async (values: FormValues) => {
		const res = await fetch(`/api/supplier/clients/${clientId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(values),
		});
		const data = await res.json().catch(() => null);
		if (!res.ok) {
			toast.error(data?.error || "Erro ao salvar cliente");
			return;
		}
		toast.success("Cliente atualizado.");
		router.push(`/supplier/clients/${clientId}`);
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push(`/supplier/clients/${clientId}`)}
				>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<h1 className="font-bold text-2xl tracking-tight">Editar cliente</h1>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Empresa do cliente</CardTitle>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
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
													onChange={(v) => {
														field.onChange(v);
														runCnpjLookup(v);
													}}
												/>
											</FormControl>
											{cnpjLoading && (
												<Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
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
										<FormLabel>Nome da empresa *</FormLabel>
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
												<Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
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
											<Input {...field} />
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
										<FormLabel>Responsável *</FormLabel>
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
										<FormLabel>E-mail *</FormLabel>
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

					<div className="flex justify-end">
						<Button type="submit" disabled={form.formState.isSubmitting}>
							<Save className="mr-2 h-4 w-4" />
							Salvar
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
