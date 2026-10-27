import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex h-[46px] w-full min-w-0 rounded-[6px] border bg-card px-3 text-sm shadow-xs transition-[border-color] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
				"focus-visible:border-primary",
				"aria-invalid:border-destructive",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
