import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-[13px] font-semibold transition-[background,color,border-color] duration-200 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-primary aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					"border border-primary bg-primary text-primary-foreground shadow-xs hover:border-primary-hover hover:bg-primary-hover",
				destructive:
					"border border-destructive bg-destructive text-white shadow-xs hover:bg-destructive/90",
				outline:
					"border border-border bg-transparent text-foreground shadow-xs hover:border-[#c8d1e0] hover:bg-secondary",
				secondary:
					"border border-transparent bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
				ghost: "hover:bg-secondary hover:text-foreground",
				link: "text-primary underline-offset-4 hover:text-primary-hover hover:underline",
			},
			size: {
				default: "h-11 px-5",
				sm: "h-10 gap-1.5 px-3.5 text-xs",
				lg: "h-12 px-6",
				icon: "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
