import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { deleteObject, putObject } from "@/lib/storage";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const EXT: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
};

export async function POST(request: Request) {
	try {
		const user = await requireAuth();
		const form = await request.formData();
		const file = form.get("file");
		if (!(file instanceof File)) {
			return NextResponse.json(
				{ error: "Arquivo é obrigatório" },
				{ status: 400 },
			);
		}
		const ext = EXT[file.type];
		if (!ext) {
			return NextResponse.json(
				{ error: "Use uma imagem PNG, JPG ou WEBP" },
				{ status: 400 },
			);
		}
		if (file.size > MAX_BYTES) {
			return NextResponse.json(
				{ error: "Imagem muito grande (máx. 2MB)" },
				{ status: 400 },
			);
		}

		const key = `avatars/${user.id}-${Date.now()}.${ext}`;
		const bytes = Buffer.from(await file.arrayBuffer());

		const previous = await prisma.user.findUnique({
			where: { id: user.id },
			select: { avatarUrl: true },
		});
		const avatarUrl = await putObject(key, bytes, file.type);
		await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
		await deleteObject(previous?.avatarUrl ?? null);

		return NextResponse.json({ avatarUrl });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Avatar upload error:", error);
		return NextResponse.json(
			{ error: "Erro ao enviar a foto" },
			{ status: 500 },
		);
	}
}

export async function DELETE() {
	try {
		const user = await requireAuth();
		const current = await prisma.user.findUnique({
			where: { id: user.id },
			select: { avatarUrl: true },
		});
		await prisma.user.update({
			where: { id: user.id },
			data: { avatarUrl: null },
		});
		await deleteObject(current?.avatarUrl ?? null);
		return NextResponse.json({ success: true });
	} catch (error) {
		if (error instanceof AuthError) {
			return NextResponse.json(
				{ error: error.message },
				{ status: error.status },
			);
		}
		console.error("Avatar delete error:", error);
		return NextResponse.json(
			{ error: "Erro ao remover a foto" },
			{ status: 500 },
		);
	}
}
