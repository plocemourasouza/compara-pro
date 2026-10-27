import type * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				"border-input placeholder:text-muted-foreground aria-invalid:border-destructive flex field-sizing-content min-h-24 w-full rounded-[6px] border bg-card px-3 py-3 text-sm shadow-xs transition-[border-color] outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
