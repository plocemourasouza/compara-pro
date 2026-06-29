import { NextResponse } from "next/server";
import { z } from "zod";
import { scopedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { formatters, masks } from "@/lib/utils/masks";

const editClientSchema = z.object({
	name: z.string().min(2, "Informe o nome da empresa"),
	cnpj: z
		.string()
		.transform((v) => v.replace(/\D/g, ""))
		.refine((v) => v === "" || v.length === 14, "CNPJ inválido")
		.optional(),
	zipCode: z.string().optional(),
	street: z.string().optional(),
	number: z.string().optional(),
	neighborhood: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	// Contato/responsável (atualiza também o usuário de login do cliente).
	responsibleName: z.string().min(2, "Informe o responsável"),
	responsibleEmail: z.string().email("E-mail inválido"),
	responsiblePhone: z.string().optional(),
});

/** Vínculos do cliente com os fornecedores representados (carteira). */
async function carteiraLinks(supplierIds: string[], clientId: string) {
	if (supplierIds.length === 0) return [];
	return prisma.supplierClient.findMany({
		where: {
			supplierCompanyId: { in: supplierIds },
			clientCompanyId: clientId,
		},
		include: { supplier: { select: { id: true, name: true } } },
	});
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		// ADMIN (suporte) enxerga a carteira de todos os fornecedores.
		const supplierIds = await scopedSupplierIds(user);

		const links = await carteiraLinks(supplierIds, id);
		if (links.length === 0 && user.area !== "ADMIN") {
			return NextResponse.json(
				{ error: "Cliente não está na sua carteira" },
				{ status: 404 },
			);
		}

		const [client, demands] = await Promise.all([
			prisma.company.findUnique({
				where: { id },
				select: {
					id: true,
					name: true,
					legalName: true,
					cnpj: true,
					email: true,
					phone: true,
					zipCode: true,
					street: true,
					number: true,
					neighborhood: true,
					city: true,
					state: true,
					responsibleName: true,
					responsibleEmail: true,
					responsiblePhone: true,
				},
			}),
			prisma.uploadHistory.findMany({
				where: { companyId: id, uploadType: "CLIENT_REQUIREMENTS" },
				orderBy: { uploadedAt: "desc" },
				select: {
					id: true,
					fileName: true,
					status: true,
					totalRows: true,
					processedRows: true,
					errorRows: true,
					uploadedAt: true,
				},
			}),
		]);

		if (!client) {
			return NextResponse.json(
				{ error: "Cliente não encontrado" },
				{ status: 404 },
			);
		}

		// Fornecedores representados que carregam este cliente — alimenta o
		// seletor de fornecedor das indicações.
		const suppliers = links.map((l) => ({
			id: l.supplier.id,
			name: l.supplier.name,
		}));

		return NextResponse.json({
			// CNPJ completo: o dono (rep/admin) está vendo o próprio cliente.
			client: {
				...client,
				cnpj: client.cnpj ? formatters.cnpj(client.cnpj) : null,
			},
			demands,
			suppliers,
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Get supplier client error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		// ADMIN (suporte) pode remover vínculos de qualquer fornecedor.
		const supplierIds = await scopedSupplierIds(user);

		const links = await carteiraLinks(supplierIds, id);
		if (links.length === 0) {
			return NextResponse.json(
				{ error: "Cliente não está na sua carteira" },
				{ status: 404 },
			);
		}

		// Remove de um fornecedor específico (?supplierCompanyId=) ou de todos os
		// fornecedores representados — nunca apaga a empresa do cliente.
		const only = new URL(request.url).searchParams.get("supplierCompanyId");
		const toRemove = only
			? links.filter((l) => l.supplierCompanyId === only)
			: links;
		if (toRemove.length === 0) {
			return NextResponse.json(
				{ error: "Vínculo não encontrado" },
				{ status: 404 },
			);
		}
		await prisma.supplierClient.deleteMany({
			where: { id: { in: toRemove.map((l) => l.id) } },
		});
		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Remove supplier client error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// Edita os dados da empresa cliente (nome, CNPJ, cidade, UF).
// REPRESENTATIVE só edita clientes da própria carteira; ADMIN qualquer cliente.
export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const supplierIds = await scopedSupplierIds(user);
		const links = await carteiraLinks(supplierIds, id);
		if (links.length === 0 && user.area !== "ADMIN") {
			return NextResponse.json(
				{ error: "Cliente não está na sua carteira" },
				{ status: 404 },
			);
		}

		const parsed = editClientSchema.safeParse(await request.json());
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
				{ status: 400 },
			);
		}
		const data = parsed.data;

		const target = await prisma.company.findUnique({ where: { id } });
		if (target?.type !== "CLIENT") {
			return NextResponse.json(
				{ error: "Cliente não encontrado" },
				{ status: 404 },
			);
		}

		const cnpjDigits = data.cnpj ? masks.removeNonDigits(data.cnpj) : "";
		const cnpj = cnpjDigits.length === 14 ? cnpjDigits : null;
		if (cnpj) {
			const clash = await prisma.company.findFirst({
				where: { cnpj, id: { not: id } },
				select: { id: true },
			});
			if (clash) {
				return NextResponse.json(
					{ error: "CNPJ já usado por outra empresa" },
					{ status: 409 },
				);
			}
		}

		const respEmail = data.responsibleEmail.trim().toLowerCase();
		const respPhone = data.responsiblePhone
			? masks.removeNonDigits(data.responsiblePhone) || null
			: null;
		const zipCode = data.zipCode
			? masks.removeNonDigits(data.zipCode) || null
			: null;

		const updated = await prisma.company.update({
			where: { id },
			data: {
				name: data.name,
				cnpj,
				street: data.street || null,
				number: data.number || null,
				neighborhood: data.neighborhood || null,
				city: data.city || null,
				state: data.state ? data.state.toUpperCase() : null,
				zipCode,
				email: respEmail,
				phone: respPhone,
				responsibleName: data.responsibleName,
				responsibleEmail: respEmail,
				responsiblePhone: respPhone,
			},
			select: { id: true, name: true },
		});

		// Atualiza (ou cria) o contato/usuário de login do cliente.
		const contact = await prisma.user.findFirst({
			where: { companyId: id },
			orderBy: { createdAt: "asc" },
			select: { id: true, email: true },
		});
		if (contact) {
			if (respEmail !== contact.email) {
				const emailClash = await prisma.user.findUnique({
					where: { email: respEmail },
					select: { id: true },
				});
				if (emailClash && emailClash.id !== contact.id) {
					return NextResponse.json(
						{ error: "E-mail já usado por outro usuário" },
						{ status: 409 },
					);
				}
			}
			await prisma.user.update({
				where: { id: contact.id },
				data: {
					name: data.responsibleName,
					email: respEmail,
					phone: respPhone,
				},
			});
		}

		return NextResponse.json({ client: updated });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Edit supplier client error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
