import { cn } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "xl";
type AvatarColor = "gold" | "blue" | "green" | "purple" | "pink" | "teal";

const sizes: Record<AvatarSize, string> = {
  sm: "w-7 h-7 text-sm",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
  xl: "w-16 h-16 text-xl",
};

const colors: Record<AvatarColor, string> = {
  gold: "bg-gold-light text-gold-dark",
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  purple: "bg-purple-100 text-purple-800",
  pink: "bg-pink-100 text-pink-800",
  teal: "bg-teal-100 text-teal-800",
};

interface AvatarProps {
  initials: string;
  size?: AvatarSize;
  color?: AvatarColor;
  online?: boolean;
  className?: string;
}

export function Avatar({
  initials,
  size = "md",
  color = "gold",
  online = false,
  className,
}: AvatarProps) {
  return (
    <div className="relative inline-block flex-shrink-0">
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-medium",
          sizes[size],
          colors[color],
          className,
        )}
      >
        {initials}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-white" />
      )}
    </div>
  );
}
