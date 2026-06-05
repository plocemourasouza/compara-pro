import { Resend } from "resend";

const FROM = process.env.FROM_EMAIL || "ComparaPro <onboarding@resend.dev>";

/** Email is opt-in: enabled only when RESEND_API_KEY is set. */
export function isEmailEnabled(): boolean {
	return Boolean(process.env.RESEND_API_KEY);
}

function getClient(): Resend | null {
	const key = process.env.RESEND_API_KEY;
	return key ? new Resend(key) : null;
}

function escapeHtml(value: string): string {
	const map: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
	};
	return value.replace(/[&<>"]/g, (c) => map[c] ?? c);
}

function renderEmail(title: string, message: string): string {
	return `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="color:#f54e00;margin:0 0 16px">ComparaPro</h2>
  <h3 style="margin:0 0 8px;font-size:16px">${escapeHtml(title)}</h3>
  <p style="line-height:1.5;color:#444;margin:0">${escapeHtml(message)}</p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#999;margin:0">Você recebeu este e-mail porque tem uma conta no ComparaPro.</p>
</div>`;
}

/**
 * Best-effort transactional email. No-op when email is disabled (no API key) and
 * never throws — the in-app notification remains the source of truth.
 */
export async function sendNotificationEmail(params: {
	to: string[];
	subject: string;
	message: string;
}): Promise<void> {
	const client = getClient();
	const recipients = params.to.filter(Boolean);
	if (!client || recipients.length === 0) {
		return;
	}
	try {
		await client.emails.send({
			from: FROM,
			to: recipients,
			subject: params.subject,
			html: renderEmail(params.subject, params.message),
		});
	} catch (error) {
		console.error(
			"Email send failed:",
			error instanceof Error ? error.message : "unknown",
		);
	}
}
