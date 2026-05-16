import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FDFAF6] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="font-playfair text-2xl font-bold text-gray-900 hover:opacity-80 transition-opacity"
        >
          Fundi
        </Link>
        <p className="font-dm-sans text-sm text-gray-400 mt-1">
          The professional identity platform
        </p>
      </div>

      {/* Page content — each page renders its own white card */}
      <div className="w-full max-w-[420px]">{children}</div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-center gap-3 font-dm-sans text-xs text-gray-300">
        <span>© 2026 Fundi</span>
        <Link href="/privacy" className="hover:text-gray-500 transition-colors">
          Privacy
        </Link>
        <Link href="/terms" className="hover:text-gray-500 transition-colors">
          Terms
        </Link>
      </div>
    </div>
  );
}
