import { NextResponse } from "next/server";
import { z } from "zod";
import {
	activationExpiry,
	buildActivationLink,
	generateActivationCode,
	hashActivationCode,
} from "@/lib/auth-activation";
import { getRepresentedSupplierIds } from "@/lib/auth-scope";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const addClientSchema = z.object({
	supplierCompanyId: z.string().min(1, "Selecione o fornecedor"),
	companyName: z.string().min(2, "Informe o nome da empresa"),
	cnpj: z
		.string()
		.transform((v) => v.replace(/\D/g, ""))
		.refine((v) => v === "" || v.length === 14, "CNPJ inválido")
		.optional(),
	city: z.string().optional(),
	state: z.string().optional(),
	userName: z.string().min(2, "Informe o nome do contato"),
	userEmail: z.string().email("E-mail inválido"),
	userPhone: z.string().optional(),
});

export async function GET() {
	try {
		const user = await requireAuth(["REPRESENTATIVE", "ADMIN"]);
		const supplierIds = await getRepresentedSupplierIds(user);
		if (supplierIds.length === 0) {
			return NextResponse.json({ clients: [] });
		}

		const links = await prisma.supplierClient.findMany({
			where: { supplierCompanyId: { in: supplierIds } },
			orderBy: { createdAt: "desc" },
			include: {
				client: {
					select: {
						id: true,
						name: true,
						cnpj: true,
						city: true,
						state: true,
					},
				},
				supplier: { select: { id: true, name: true } },
			},
		});

		const clientIds = [...new Set(links.map((l) => l.clientCompanyId))];
		const demands = clientIds.length
			? await prisma.uploadHistory.groupBy({
					by: ["companyId"],
					where: {
						companyId: { in: clientIds },
						uploadType: "CLIENT_REQUIREMENTS",
					},
					_count: { _all: true },
					_max: { uploadedAt: true },
				})
			: [];
		const byCompany = new Map(demands.map((d) => [d.companyId, d]));

		// Aggregate by client: one row per client, with the represented suppliers
		// that carry it as badges (a client may be in several carteiras).
		type ClientRow = {
			id: string;
			name: string;
			cnpj: string | null;
			city: string | null;
			state: string | null;
			demandCount: number;
			lastDemandAt: Date | null;
			addedAt: Date;
			suppliers: { linkId: string; companyId: string; name: string }[];
		};
		const map = new Map<string, ClientRow>();
		for (const l of links) {
			let row = map.get(l.client.id);
			if (!row) {
				const d = byCompany.get(l.clientCompanyId);
				row = {
					id: l.client.id,
					name: l.client.name,
					cnpj: l.client.cnpj,
					city: l.client.city,
					state: l.client.state,
					demandCount: d?._count._all ?? 0,
					lastDemandAt: d?._max.uploadedAt ?? null,
					addedAt: l.createdAt,
					suppliers: [],
				};
				map.set(l.client.id, row);
			}
			row.suppliers.push({
				linkId: l.id,
				companyId: l.supplier.id,
				name: l.supplier.name,
			});
		}

		return NextResponse.json({ clients: [...map.values()] });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("List supplier clients error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const user = await requireAuth(["REPRESENTATIVE"]);

		const parsed = addClientSchema.safeParse(await request.json());
		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.issues[0]?.message ?? "Dados inválidos" },
				{ status: 400 },
			);
		}
		const data = parsed.data;

		// O cliente entra na carteira de um fornecedor específico que o
		// representante representa.
		const supplierIds = await getRepresentedSupplierIds(user);
		if (!supplierIds.includes(data.supplierCompanyId)) {
			return NextResponse.json(
				{ error: "Selecione um fornecedor que você representa" },
				{ status: 403 },
			);
		}
		const supplierCompanyId = data.supplierCompanyId;
		const cnpj = data.cnpj && data.cnpj.length === 14 ? data.cnpj : null;

		// Acha empresa CLIENT existente (por CNPJ, senão por nome) ou cria.
		let client = cnpj
			? await prisma.company.findFirst({ where: { cnpj } })
			: await prisma.company.findFirst({
					where: { name: { equals: data.companyName, mode: "insensitive" } },
				});

		if (client && client.type !== "CLIENT") {
			return NextResponse.json(
				{ error: "Empresa já cadastrada como fornecedor." },
				{ status: 409 },
			);
		}
		if (!client) {
			client = await prisma.company.create({
				data: {
					name: data.companyName,
					cnpj,
					type: "CLIENT",
					city: data.city || null,
					state: data.state || null,
				},
			});
		}

		// Vínculo idempotente.
		const existingLink = await prisma.supplierClient.findUnique({
			where: {
				supplierCompanyId_clientCompanyId: {
					supplierCompanyId,
					clientCompanyId: client.id,
				},
			},
		});
		if (existingLink) {
			return NextResponse.json(
				{ error: "Cliente já está na sua carteira." },
				{ status: 409 },
			);
		}
		await prisma.supplierClient.create({
			data: { supplierCompanyId, clientCompanyId: client.id },
		});

		// Convida o usuário do cliente (primeiro acesso por código), se novo.
		let activation: { code: string; link: string } | null = null;
		const existingUser = await prisma.user.findUnique({
			where: { email: data.userEmail },
		});
		if (!existingUser) {
			const code = generateActivationCode();
			await prisma.user.create({
				data: {
					email: data.userEmail,
					name: data.userName,
					phone: data.userPhone?.trim() || null,
					companyId: client.id,
					password: null,
					activationCodeHash: await hashActivationCode(code),
					activationExpiresAt: activationExpiry(),
				},
			});
			activation = { code, link: buildActivationLink() };
		}

		return NextResponse.json(
			{
				client: { id: client.id, name: client.name },
				activation,
				userExisted: Boolean(existingUser),
			},
			{ status: 201 },
		);
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Add supplier client error:", error);
		return NextResponse.json(
			{ error: "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
