import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Tesilix brand logo — a plumb-bob fused with a location pin ("skilled trades,
 * near you") + the Fraunces wordmark. Use <LogoMark> alone for favicons/avatars
 * and tight spaces; use <Logo> for the full lockup in nav/auth/footer.
 */

type MarkVariant = "navy" | "gold" | "bare-navy" | "bare-gold";

const MARK_COLORS: Record<MarkVariant, { tile: string | null; ink: string }> = {
  navy: { tile: "var(--color-navy)", ink: "var(--color-gold)" },
  gold: { tile: "var(--color-gold)", ink: "var(--color-navy)" },
  "bare-navy": { tile: null, ink: "var(--color-navy)" },
  "bare-gold": { tile: null, ink: "var(--color-gold)" },
};

export function LogoMark({
  size = 36,
  variant = "navy",
  className,
  title = "Tesilix",
}: {
  size?: number;
  variant?: MarkVariant;
  className?: string;
  title?: string;
}) {
  const { tile, ink } = MARK_COLORS[variant];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      role="img"
      aria-label={title}
      className={cn("flex-shrink-0", className)}
    >
      {tile && <rect width="72" height="72" rx="18" fill={tile} />}
      {/* location pin outline */}
      <path
        d="M36 16 C45 16 51 23 51 32 C51 43 36 56 36 56 C36 56 21 43 21 32 C21 23 27 16 36 16 Z"
        fill="none"
        stroke={ink}
        strokeWidth="3.5"
      />
      {/* plumb line + bob */}
      <line x1="36" y1="14" x2="36" y2="34" stroke={ink} strokeWidth="2.4" />
      <circle cx="36" cy="34" r="5.5" fill={ink} />
    </svg>
  );
}

type LogoTone = "navy" | "light";
type LogoSize = "sm" | "md" | "lg";

const SIZES: Record<LogoSize, { mark: number; word: string }> = {
  sm: { mark: 28, word: "text-lg" },
  md: { mark: 34, word: "text-[22px]" },
  lg: { mark: 44, word: "text-3xl" },
};

interface LogoProps {
  /** Wordmark color: navy (on light bg) or light/white (on navy bg). */
  tone?: LogoTone;
  size?: LogoSize;
  /** Override the mark tile color; defaults from tone (navy bg → gold tile). */
  markVariant?: MarkVariant;
  /** Show only the wordmark (no icon). */
  wordmarkOnly?: boolean;
  /** Show only the icon mark (no wordmark). */
  markOnly?: boolean;
  /** Wrap in a Link to this href. */
  href?: string;
  className?: string;
}

export function Logo({
  tone = "navy",
  size = "md",
  markVariant,
  wordmarkOnly = false,
  markOnly = false,
  href,
  className,
}: LogoProps) {
  const { mark, word } = SIZES[size];
  const variant: MarkVariant =
    markVariant ?? (tone === "light" ? "gold" : "navy");

  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {!wordmarkOnly && <LogoMark size={mark} variant={variant} />}
      {!markOnly && (
        <span
          className={cn(
            "font-serif font-medium leading-none tracking-[-0.01em]",
            word,
            tone === "light" ? "text-white" : "text-navy",
          )}
        >
          Tesilix
          <span className="italic font-normal text-gold">.</span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center no-underline">
        {content}
      </Link>
    );
  }
  return content;
}
