import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Logo href="/" size="md" />
        <p className="text-sm text-ink-3 mt-1">
          The global skilled worker marketplace
        </p>
      </div>

      {/* Page content — each page renders its own white card */}
      <div className="w-full max-w-[420px]">{children}</div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-center gap-3 text-xs text-ink-3">
        <span>© 2026 Tesilix</span>
        <Link href="/privacy" className="hover:text-ink-2 transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-ink-2 transition-colors">
          Terms
        </Link>
      </div>
    </div>
  );
}
