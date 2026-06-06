"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Building2, MapPin, Save, User } from "lucide-react";
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
import { masks } from "@/lib/utils/masks";
import {
	type CreateCompanyData,
	createCompanySchema,
} from "@/lib/validations/company";

const brazilianStates = [
	"AC",
	"AL",
	"AP",
	"AM",
	"BA",
	"CE",
	"DF",
	"ES",
	"GO",
	"MA",
	"MT",
	"MS",
	"MG",
	"PA",
	"PB",
	"PR",
	"PE",
	"PI",
	"RJ",
	"RN",
	"RS",
	"RO",
	"RR",
	"SC",
	"SP",
	"SE",
	"TO",
] as const;

const addressTypes = [
	"Rua",
	"Avenida",
	"Travessa",
	"Alameda",
	"Praça",
	"Estrada",
	"Rodovia",
	"Largo",
	"Quadra",
	"Conjunto",
	"Lote",
	"Sítio",
];

const taxRegimes = [
	{ value: "MEI", label: "MEI" },
	{ value: "SIMPLES_NACIONAL", label: "Simples Nacional" },
	{ value: "LUCRO_PRESUMIDO", label: "Lucro Presumido" },
	{ value: "LUCRO_REAL", label: "Lucro Real" },
] as const;

const EMPTY_DEFAULTS: CreateCompanyData = {
	name: "",
	legalName: "",
	cnpj: "",
	type: "SUPPLIER",
	taxRegime: "SIMPLES_NACIONAL",
	email: "",
	phone: "",
	responsibleName: "",
	responsibleEmail: "",
	responsiblePhone: "",
	addressType: "Rua",
	street: "",
	number: "",
	neighborhood: "",
	city: "",
	state: "SP",
	zipCode: "",
	addressReference: "",
};

interface CompanyFormProps {
	mode: "create" | "edit";
	companyId?: string;
	defaultValues?: Partial<CreateCompanyData>;
}

export function CompanyForm({
	mode,
	companyId,
	defaultValues,
}: CompanyFormProps) {
	const router = useRouter();
	const form = useForm<CreateCompanyData>({
		resolver: zodResolver(createCompanySchema),
		defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
	});

	const onSubmit = async (values: CreateCompanyData) => {
		const url =
			mode === "edit" ? `/api/companies/${companyId}` : "/api/companies";
		const method = mode === "edit" ? "PUT" : "POST";

		try {
			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});

			if (response.ok) {
				toast.success(
					mode === "edit"
						? "Empresa atualizada com sucesso!"
						: "Empresa criada com sucesso!",
				);
				router.push("/admin/companies");
				router.refresh();
				return;
			}

			const data = await response.json();
			if (Array.isArray(data.details)) {
				for (const issue of data.details) {
					const field = issue.path?.[0];
					if (field) {
						form.setError(field as keyof CreateCompanyData, {
							message: issue.message,
						});
					}
				}
			}
			toast.error(data.error || "Erro ao salvar empresa");
		} catch (error) {
			console.error("Error saving company:", error);
			toast.error("Erro ao salvar empresa");
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
						{mode === "edit" ? "Editar Empresa" : "Cadastrar Nova Empresa"}
					</h1>
					<p className="text-muted-foreground">
						{mode === "edit"
							? "Atualize os dados da empresa"
							: "Preencha os dados para cadastrar uma empresa"}
					</p>
				</div>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<Building2 className="h-5 w-5" />
								Dados da Empresa
							</CardTitle>
							<CardDescription>
								Identificação fiscal e contato da empresa.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>Nome Fantasia *</FormLabel>
										<FormControl>
											<Input
												placeholder="Nome fantasia da empresa"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="legalName"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>Razão Social *</FormLabel>
										<FormControl>
											<Input placeholder="Razão social da empresa" {...field} />
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
										<FormLabel>CNPJ *</FormLabel>
										<FormControl>
											<Input
												placeholder="00.000.000/0000-00"
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
								name="type"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Tipo *</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="SUPPLIER">Fornecedor</SelectItem>
												<SelectItem value="CLIENT">Cliente</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="taxRegime"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Enquadramento Tributário *</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{taxRegimes.map((regime) => (
													<SelectItem key={regime.value} value={regime.value}>
														{regime.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>E-mail da Empresa</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="empresa@exemplo.com"
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
									<FormItem className="sm:col-span-3">
										<FormLabel>Telefone da Empresa</FormLabel>
										<FormControl>
											<Input
												placeholder="(11) 99999-9999"
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

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<User className="h-5 w-5" />
								Dados do Responsável
							</CardTitle>
							<CardDescription>
								Pessoa de contato responsável pela empresa.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="responsibleName"
								render={({ field }) => (
									<FormItem className="sm:col-span-6">
										<FormLabel>Nome do Responsável *</FormLabel>
										<FormControl>
											<Input placeholder="Nome completo" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="responsibleEmail"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>E-mail do Responsável *</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="responsavel@exemplo.com"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="responsiblePhone"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
										<FormLabel>Telefone do Responsável *</FormLabel>
										<FormControl>
											<Input
												placeholder="(11) 99999-9999"
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

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-lg">
								<MapPin className="h-5 w-5" />
								Dados de Localização
							</CardTitle>
							<CardDescription>Endereço completo da empresa.</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="addressType"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Tipo de Logradouro *</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{addressTypes.map((type) => (
													<SelectItem key={type} value={type}>
														{type}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="street"
								render={({ field }) => (
									<FormItem className="sm:col-span-4">
										<FormLabel>Logradouro *</FormLabel>
										<FormControl>
											<Input
												placeholder="Nome da rua, avenida, etc."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="number"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>Número *</FormLabel>
										<FormControl>
											<Input placeholder="123" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="neighborhood"
								render={({ field }) => (
									<FormItem className="sm:col-span-4">
										<FormLabel>Bairro *</FormLabel>
										<FormControl>
											<Input placeholder="Nome do bairro" {...field} />
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
										<FormLabel>Cidade *</FormLabel>
										<FormControl>
											<Input placeholder="Nome da cidade" {...field} />
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
										<FormLabel>Estado *</FormLabel>
										<Select value={field.value} onValueChange={field.onChange}>
											<FormControl>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{brazilianStates.map((state) => (
													<SelectItem key={state} value={state}>
														{state}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="zipCode"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>CEP *</FormLabel>
										<FormControl>
											<Input
												placeholder="00000-000"
												{...field}
												onChange={(e) =>
													field.onChange(masks.cep(e.target.value))
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="addressReference"
								render={({ field }) => (
									<FormItem className="sm:col-span-6">
										<FormLabel>Referência</FormLabel>
										<FormControl>
											<Input
												placeholder="Próximo ao shopping, em frente à igreja, etc."
												{...field}
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
							onClick={() => router.push("/admin/companies")}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							<Save className="mr-2 h-4 w-4" />
							{isSubmitting
								? "Salvando..."
								: mode === "edit"
									? "Salvar Alterações"
									: "Criar Empresa"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
