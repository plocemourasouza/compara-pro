import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function initials(name: string): string {
	const parts = name.trim().split(/\s+/);
	const first = parts[0]?.[0] ?? "";
	const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
	return (first + last).toUpperCase() || "?";
}

const ROLE_BG: Record<string, string> = {
	ADMIN: "bg-chart-4/15 text-chart-4",
	REPRESENTATIVE: "bg-primary/15 text-primary",
	CLIENT: "bg-success/15 text-success",
};

interface UserAvatarProps {
	name: string;
	avatarUrl?: string | null;
	role?: string;
	className?: string;
}

export function UserAvatar({
	name,
	avatarUrl,
	role,
	className,
}: UserAvatarProps) {
	return (
		<Avatar className={className}>
			{avatarUrl ? (
				<AvatarImage src={avatarUrl} alt={name} className="object-cover" />
			) : null}
			<AvatarFallback
				className={cn(
					"font-semibold",
					(role && ROLE_BG[role]) || "bg-muted text-foreground",
				)}
			>
				{initials(name)}
			</AvatarFallback>
		</Avatar>
	);
}
