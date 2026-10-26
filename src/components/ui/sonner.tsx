"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = "system" } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps["theme"]}
			className="toaster group"
			style={
				{
					"--normal-bg": "var(--popover)",
					"--normal-text": "var(--popover-foreground)",
					"--normal-border": "var(--border)",
					"--warning-bg": "#eaf0ff",
					"--warning-border": "#dce2ec",
					"--warning-text": "#3b4f86",
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };
