import { afterEach, describe, expect, it } from "vitest";
import { isEmailEnabled, sendNotificationEmail } from "./mailer";

describe("mailer", () => {
	afterEach(() => {
		delete process.env.RESEND_API_KEY;
	});

	it("is disabled without RESEND_API_KEY", () => {
		delete process.env.RESEND_API_KEY;
		expect(isEmailEnabled()).toBe(false);
	});

	it("is enabled with RESEND_API_KEY", () => {
		process.env.RESEND_API_KEY = "re_test_key";
		expect(isEmailEnabled()).toBe(true);
	});

	it("no-ops (no throw) when disabled", async () => {
		delete process.env.RESEND_API_KEY;
		await expect(
			sendNotificationEmail({ to: ["a@b.com"], subject: "x", message: "y" }),
		).resolves.toBeUndefined();
	});

	it("no-ops (no throw) with no recipients", async () => {
		process.env.RESEND_API_KEY = "re_test_key";
		await expect(
			sendNotificationEmail({ to: [], subject: "x", message: "y" }),
		).resolves.toBeUndefined();
	});
});
