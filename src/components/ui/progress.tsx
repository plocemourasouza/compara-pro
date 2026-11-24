"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Progress({
	className,
	value,
	...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
	const indeterminate = value == null;
	return (
		<ProgressPrimitive.Root
			data-slot="progress"
			className={cn(
				"bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
				className,
			)}
			{...props}
		>
			<ProgressPrimitive.Indicator
				data-slot="progress-indicator"
				className={cn(
					"bg-primary h-full flex-1",
					indeterminate ? "w-1/3 animate-pulse" : "w-full transition-all",
				)}
				style={
					indeterminate
						? undefined
						: { transform: `translateX(-${100 - value}%)` }
				}
			/>
		</ProgressPrimitive.Root>
	);
}

export { Progress };
