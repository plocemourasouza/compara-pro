"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	ArrowLeft,
	Building2,
	Loader2,
	Lock,
	MapPin,
	Save,
	User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
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

/** Separa o tipo de logradouro do início da rua (ex.: "Avenida Paulista"). */
function splitStreet(street: string): { addressType?: string; street: string } {
	const parts = street.trim().split(/\s+/);
	const first = parts[0];
	const match = addressTypes.find(
		(t) => t.toLowerCase() === first?.toLowerCase(),
	);
	if (match && parts.length > 1) {
		return { addressType: match, street: parts.slice(1).join(" ") };
	}
	return { street };
}

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
	const locked = mode === "edit";
	const form = useForm<CreateCompanyData>({
		resolver: zodResolver(createCompanySchema),
		defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
	});

	const [cnpjLoading, setCnpjLoading] = useState(false);
	const [cepLoading, setCepLoading] = useState(false);
	const lastCnpj = useRef("");
	const lastCep = useRef("");

	// Aplica o valor quando definido (inclui string vazia), para que uma nova
	// consulta de CNPJ/CEP que retorne "" limpe o valor anterior em vez de
	// manter dado stale. Só `undefined` (campo ausente na resposta) é ignorado.
	const setValue = (field: keyof CreateCompanyData, value?: string) => {
		if (value !== undefined) {
			form.setValue(field, value, { shouldValidate: true, shouldDirty: true });
		}
	};

	const fillAddressFromStreet = (rawStreet: string) => {
		const { addressType, street } = splitStreet(rawStreet);
		if (addressType) setValue("addressType", addressType);
		setValue("street", street);
	};

	const runCnpjLookup = async (masked: string) => {
		const digits = masked.replace(/\D/g, "");
		if (locked || digits.length !== 14 || digits === lastCnpj.current) return;
		lastCnpj.current = digits;
		setCnpjLoading(true);
		try {
			const res = await fetch(`/api/lookup/cnpj/${digits}`);
			const data = await res.json();
			if (!res.ok) {
				toast.error(data.error || "Não foi possível buscar o CNPJ.");
				return;
			}
			setValue("name", data.name);
			setValue("legalName", data.legalName);
			setValue("email", data.email);
			if (data.phone) setValue("phone", masks.phone(data.phone));
			if (data.taxRegime) setValue("taxRegime", data.taxRegime);
			setValue("responsibleName", data.responsibleName);
			const a = data.address ?? {};
			if (a.zipCode) setValue("zipCode", masks.cep(a.zipCode));
			if (a.street) fillAddressFromStreet(a.street);
			setValue("number", a.number);
			setValue("neighborhood", a.neighborhood);
			setValue("city", a.city);
			setValue("state", a.state);
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
			if (data.street) fillAddressFromStreet(data.street);
			setValue("neighborhood", data.neighborhood);
			setValue("city", data.city);
			setValue("state", data.state);
			toast.success(
				data.street
					? "Endereço preenchido a partir do CEP."
					: "CEP encontrado, mas sem logradouro. Preencha a rua e o número.",
			);
		} catch {
			toast.error("Não foi possível buscar o CEP.");
		} finally {
			setCepLoading(false);
		}
	};

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
							: "Informe o CNPJ para preencher automaticamente os dados"}
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
								{locked
									? "O CNPJ não pode ser alterado."
									: "Informe o CNPJ para buscar os dados automaticamente."}
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="cnpj"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel className="flex items-center gap-1">
											CNPJ *
											{locked && <Lock className="h-3 w-3 text-primary" />}
										</FormLabel>
										<div className="relative">
											<FormControl>
												{locked ? (
													<Input
														{...field}
														readOnly
														aria-readonly
														className="border-primary/60 bg-primary/5 font-semibold text-foreground"
													/>
												) : (
													<Input
														placeholder="00.000.000/0000-00"
														inputMode="numeric"
														className={cnpjLoading ? "pr-9" : undefined}
														{...field}
														onChange={(e) => {
															const m = masks.cnpj(e.target.value);
															field.onChange(m);
															runCnpjLookup(m);
														}}
													/>
												)}
											</FormControl>
											{!locked && cnpjLoading && (
												<Loader2 className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
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
									<FormItem className="sm:col-span-3 sm:col-start-1">
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
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem className="sm:col-span-3">
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
									<FormItem className="sm:col-span-3">
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
									<FormItem className="sm:col-span-2">
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
									<FormItem className="sm:col-span-2">
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
									<FormItem className="sm:col-span-2">
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
							<CardDescription>
								Informe o CEP para preencher o endereço automaticamente.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
							<FormField
								control={form.control}
								name="zipCode"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
										<FormLabel>CEP *</FormLabel>
										<div className="relative">
											<FormControl>
												<Input
													placeholder="00000-000"
													inputMode="numeric"
													className={cepLoading ? "pr-9" : undefined}
													{...field}
													onChange={(e) => {
														const m = masks.cep(e.target.value);
														field.onChange(m);
														runCepLookup(m);
													}}
												/>
											</FormControl>
											{cepLoading && (
												<Loader2 className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
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
									<FormItem className="sm:col-span-2">
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
								name="addressReference"
								render={({ field }) => (
									<FormItem className="sm:col-span-2">
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
