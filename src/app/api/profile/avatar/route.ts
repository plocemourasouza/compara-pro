import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { AuthError, requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const EXT: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
};
const AVATAR_DIR = join(process.cwd(), "public", "uploads", "avatars");

/** Remove um avatar anterior do disco (best-effort, nunca quebra o fluxo). */
async function removeFile(avatarUrl: string | null) {
	if (!avatarUrl?.startsWith("/uploads/avatars/")) return;
	try {
		await unlink(join(process.cwd(), "public", avatarUrl));
	} catch {
		// arquivo já removido / inexistente — ignora
	}
}

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

		await mkdir(AVATAR_DIR, { recursive: true });
		const fileName = `${user.id}-${Date.now()}.${ext}`;
		const bytes = Buffer.from(await file.arrayBuffer());
		await writeFile(join(AVATAR_DIR, fileName), bytes);

		const previous = await prisma.user.findUnique({
			where: { id: user.id },
			select: { avatarUrl: true },
		});
		const avatarUrl = `/uploads/avatars/${fileName}`;
		await prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
		await removeFile(previous?.avatarUrl ?? null);

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
		await removeFile(current?.avatarUrl ?? null);
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
