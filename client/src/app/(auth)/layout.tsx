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

      {/* Right panel — form area */}
      <div
        className="flex-1 flex flex-col px-6 py-12 md:px-12 md:items-center md:justify-center min-h-screen md:min-h-0"
        style={{ background: "var(--cream)" }}
      >
        <div className="w-full max-w-[440px] mx-auto">{children}</div>
      </div>
    </div>
  );
}
