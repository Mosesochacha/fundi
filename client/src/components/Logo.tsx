import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Tesilix brand logo (image assets in /public/brand).
 * - <Logo> renders the full wordmark lockup: `lightlogo` (navy ink, for light
 *   backgrounds) or `darklogo` (white ink, for dark backgrounds via tone="light").
 * - <LogoMark> renders the square "TX" emblem — for favicons, avatars, tight spaces.
 */

type MarkVariant = "navy" | "gold" | "bare-navy" | "bare-gold";

export function LogoMark({
  size = 36,
  className,
  title = "Tesilix",
}: {
  size?: number;
  variant?: MarkVariant;
  className?: string;
  title?: string;
}) {
  return (
    <Image
      src="/brand/emblem.png"
      alt={title}
      width={size}
      height={size}
      className={cn("flex-shrink-0", className)}
      priority
    />
  );
}

type LogoTone = "navy" | "light";
type LogoSize = "sm" | "md" | "lg";

const WORD_HEIGHT: Record<LogoSize, string> = {
  sm: "h-7",
  md: "h-8",
  lg: "h-10",
};
const MARK_PX: Record<LogoSize, number> = { sm: 28, md: 32, lg: 40 };

interface LogoProps {
  /** Wordmark colour: navy (light backgrounds) or light/white (dark backgrounds). */
  tone?: LogoTone;
  size?: LogoSize;
  markVariant?: MarkVariant;
  /** Show only the wordmark (no separate behaviour — the lockup includes it). */
  wordmarkOnly?: boolean;
  /** Show only the square emblem. */
  markOnly?: boolean;
  /** Wrap in a Link to this href. */
  href?: string;
  className?: string;
}

export function Logo({
  tone = "navy",
  size = "md",
  markOnly = false,
  href,
  className,
}: LogoProps) {
  const content = markOnly ? (
    <LogoMark size={MARK_PX[size]} className={className} />
  ) : (
    <Image
      src={tone === "light" ? "/brand/darklogo.png" : "/brand/lightlogo.png"}
      alt="Tesilix"
      width={1027}
      height={219}
      priority
      className={cn("w-auto", WORD_HEIGHT[size], className)}
    />
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
