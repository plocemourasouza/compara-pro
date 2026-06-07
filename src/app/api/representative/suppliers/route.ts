import { NextResponse } from "next/server";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { supplierCompanySchema } from "@/lib/validations/representative";

// Lista os fornecedores que o representante representa, com contadores.
export async function GET() {
	try {
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const ids = await getRepresentedSupplierIds(user);
		if (ids.length === 0) {
			return NextResponse.json({ suppliers: [] });
		}

		const suppliers = await prisma.company.findMany({
			where: { id: { in: ids }, deletedAt: null },
			orderBy: { name: "asc" },
			select: {
				id: true,
				name: true,
				cnpj: true,
				city: true,
				state: true,
				_count: {
					select: { products: true, carteiraClientes: true },
				},
			},
		});

		return NextResponse.json({
			suppliers: suppliers.map((s) => ({
				id: s.id,
				name: s.name,
				cnpj: s.cnpj,
				city: s.city,
				state: s.state,
				productCount: s._count.products,
				clientCount: s._count.carteiraClientes,
			})),
		});
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("List represented suppliers error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

// Cadastra (ou reaproveita por CNPJ/nome) um fornecedor e o vincula ao representante.
export async function POST(request: Request) {
	try {
		const user = await requireAuth(["REPRESENTATIVE"]);

		const parsed = supplierCompanySchema.safeParse(await request.json());
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
				{ status: 400 },
			);
		}
		const data = parsed.data;
		const cnpj = data.cnpj && data.cnpj.length === 14 ? data.cnpj : null;

		// Reusa empresa fornecedora existente (por CNPJ, senão por nome) ou cria.
		let company = cnpj
			? await prisma.company.findFirst({ where: { cnpj } })
			: await prisma.company.findFirst({
					where: { name: { equals: data.name, mode: "insensitive" } },
				});

		if (company && company.type !== "SUPPLIER") {
			return NextResponse.json(
				{ error: "Empresa já cadastrada como cliente." },
				{ status: 409 },
			);
		}
		if (!company) {
			company = await prisma.company.create({
				data: {
					name: data.name,
					cnpj,
					type: "SUPPLIER",
					city: data.city || null,
					state: data.state || null,
				},
			});
		}

		// Vínculo idempotente representante ↔ fornecedor.
		await prisma.representativeSupplier.upsert({
			where: {
				representativeId_supplierCompanyId: {
					representativeId: user.id,
					supplierCompanyId: company.id,
				},
			},
			update: {},
			create: { representativeId: user.id, supplierCompanyId: company.id },
		});

		return NextResponse.json(
			{ supplier: { id: company.id, name: company.name } },
			{ status: 201 },
		);
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Create represented supplier error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
