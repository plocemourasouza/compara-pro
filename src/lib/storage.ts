import {
	DeleteObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";

/**
 * Object storage para uploads de runtime (avatares).
 *
 * Backend: AWS S3. A fs da Vercel é read-only, então uploads não podem ir
 * para `public/uploads/`.
 *
 * Fail-secure: cada env var obrigatória lança se ausente — sem defaults
 * silenciosos que mascarariam má configuração em produção.
 *
 * O bucket precisa servir os objetos publicamente (bucket policy de leitura
 * pública ou CloudFront). NÃO definimos ACL: 'public-read' no PutObject porque
 * buckets novos têm Object Ownership = "Bucket owner enforced" (ACLs desligadas),
 * o que faria a chamada falhar.
 */

function requireEnv(key: string): string {
	const value = process.env[key];
	if (!value) {
		throw new Error(`Variável de ambiente obrigatória ausente: ${key}`);
	}
	return value;
}

let cachedClient: S3Client | null = null;

function client(): S3Client {
	if (cachedClient) return cachedClient;
	cachedClient = new S3Client({
		region: requireEnv("AWS_REGION"),
		credentials: {
			accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
			secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),
		},
	});
	return cachedClient;
}

/**
 * Base pública dos objetos, sem barra final.
 * Usa S3_PUBLIC_URL se definida (ex. domínio CloudFront); senão deriva a URL
 * virtual-hosted padrão do bucket: https://<bucket>.s3.<region>.amazonaws.com
 */
function publicBase(): string {
	const explicit = process.env.S3_PUBLIC_URL;
	if (explicit) return explicit.replace(/\/+$/, "");
	return `https://${requireEnv("S3_BUCKET")}.s3.${requireEnv("AWS_REGION")}.amazonaws.com`;
}

/**
 * Sobe um objeto e retorna a URL pública absoluta.
 * @param key caminho dentro do bucket, ex. `avatars/<userId>-<ts>.png`
 */
export async function putObject(
	key: string,
	body: Buffer,
	contentType: string,
): Promise<string> {
	await client().send(
		new PutObjectCommand({
			Bucket: requireEnv("S3_BUCKET"),
			Key: key,
			Body: body,
			ContentType: contentType,
			CacheControl: "public, max-age=31536000, immutable",
		}),
	);
	return `${publicBase()}/${key}`;
}

/**
 * Remove um objeto a partir da sua URL pública (best-effort).
 * Ignora URLs que não pertencem a este bucket (ex. caminhos `/uploads/...`
 * legados de disco local), para não quebrar o fluxo.
 */
export async function deleteObject(url: string | null): Promise<void> {
	if (!url) return;
	const base = publicBase();
	if (!url.startsWith(`${base}/`)) return;
	const key = url.slice(base.length + 1);
	if (!key) return;
	try {
		await client().send(
			new DeleteObjectCommand({ Bucket: requireEnv("S3_BUCKET"), Key: key }),
		);
	} catch {
		// objeto já removido / inexistente — ignora
	}
}
