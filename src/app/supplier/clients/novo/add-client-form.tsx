"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import { masks } from "@/lib/utils/masks";

const schema = z.object({
	companyName: z.string().min(2, "Informe o nome da empresa"),
	cnpj: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	userName: z.string().min(2, "Informe o nome do contato"),
	userEmail: z.string().email("E-mail inválido"),
	userPhone: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AddClientForm() {
	const router = useRouter();
	const [result, setResult] = useState<{
		name: string;
		code: string | null;
		link: string | null;
		userExisted: boolean;
	} | null>(null);

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			companyName: "",
			cnpj: "",
			city: "",
			state: "",
			userName: "",
			userEmail: "",
			userPhone: "",
		},
	});

	const onSubmit = async (values: FormValues) => {
		const res = await fetch("/api/supplier/clients", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(values),
		});
		const data = await res.json();
		if (!res.ok) {
			toast.error(data.error || "Erro ao adicionar cliente");
			return;
		}
		toast.success("Cliente adicionado à carteira.");
		setResult({
			name: data.client.name,
			code: data.activation?.code ?? null,
			link: data.activation?.link ?? null,
			userExisted: Boolean(data.userExisted),
		});
	};

	if (result) {
		return (
			<div className="mx-auto max-w-xl space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-lg">
							<CheckCircle2 className="h-5 w-5 text-success" />
							{result.name} adicionado
						</CardTitle>
						<CardDescription>
							{result.userExisted
								? "O usuário do cliente já existia e foi vinculado."
								: "Envie o código de primeiro acesso ao contato do cliente."}
						</CardDescription>
					</CardHeader>
					{result.code && (
						<CardContent className="space-y-2">
							<div className="rounded-md border bg-muted/40 p-4 text-center">
								<p className="text-muted-foreground text-xs">
									Código de primeiro acesso
								</p>
								<p className="font-bold font-mono text-2xl tracking-widest">
									{result.code}
								</p>
							</div>
							{result.link && (
								<p className="text-center text-muted-foreground text-sm">
									Acesso em <span className="font-medium">{result.link}</span>
								</p>
							)}
						</CardContent>
					)}
					<CardContent className="flex gap-2">
						<Button onClick={() => router.push("/supplier/clients")}>
							Ver carteira
						</Button>
						<Button
							variant="outline"
							onClick={() => {
								setResult(null);
								form.reset();
							}}
						>
							Adicionar outro
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-3">
				<Button variant="ghost" size="sm" onClick={() => router.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h1 className="font-bold text-2xl tracking-tight">
						Adicionar cliente
					</h1>
					<p className="text-muted-foreground">
						Cadastre o cliente e convide o contato para o primeiro acesso.
					</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Empresa do cliente</CardTitle>
							<CardDescription>Dados da empresa cliente.</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="companyName"
								render={({ field }) => (
									<FormItem className="sm:col-span-4">
										<FormLabel>Nome da Empresa *</FormLabel>
										<FormControl>
											<Input placeholder="Nome do cliente" {...field} />
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
											<Input
												placeholder="00.000.000/0000-00"
												inputMode="numeric"
												{...field}
												onChange={(e) =>
													field.onChange(masks.cnpj(e.target.value))
												}
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

					<Card>
						<CardHeader>
							<CardTitle className="text-lg">
								Contato (primeiro acesso)
							</CardTitle>
							<CardDescription>
								Quem vai acessar o sistema pelo cliente.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="userName"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>Nome do Contato *</FormLabel>
										<FormControl>
											<Input placeholder="Nome" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="userEmail"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>E-mail do Contato *</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="contato@empresa.com"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="userPhone"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>Telefone</FormLabel>
										<FormControl>
											<Input
												placeholder="(00) 00000-0000"
												inputMode="numeric"
												{...field}
												onChange={(e) =>
													field.onChange(masks.phone(e.target.value))
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</CardContent>
					</Card>

					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={() => router.push("/supplier/clients")}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={form.formState.isSubmitting}>
							<Save className="mr-2 h-4 w-4" />
							{form.formState.isSubmitting
								? "Salvando..."
								: "Adicionar cliente"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
