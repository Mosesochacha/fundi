import SocialProof from "@/components/auth/SocialProof";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — desktop only */}
      <div
        className="hidden md:flex md:w-[40%] relative overflow-hidden"
        style={{ background: "var(--orange-950)" }}
      >
        <SocialProof />
      </div>

      {/* Mobile header strip */}
      <div
        className="md:hidden h-20 flex items-center justify-center flex-shrink-0"
        style={{ background: "var(--orange-950)" }}
      >
        <span className="text-white text-2xl font-bold font-playfair">Fundi</span>
      </div>

      {/* Right panel — form area */}
      <div
        className="flex-1 flex items-center justify-center px-6 py-10 md:px-12"
        style={{ background: "var(--cream)" }}
      >
        <div className="w-full max-w-[440px]">{children}</div>
      </div>
    </div>
  );
}
