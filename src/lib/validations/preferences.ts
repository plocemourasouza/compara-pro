import { z } from "zod";

export type ActionResult =
	| { success: true }
	| { success: false; error: string };

export const preferencesSchema = z.object({
	emailNotifications: z.boolean(),
	pushNotifications: z.boolean(),
	priceAlerts: z.boolean(),
	language: z.string().min(2),
	theme: z.enum(["system", "light", "dark"]),
});

export type UserPreferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: UserPreferences = {
	emailNotifications: true,
	pushNotifications: true,
	priceAlerts: true,
	language: "pt-BR",
	theme: "system",
};
