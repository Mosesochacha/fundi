import Link from "next/link";
import type { ReactNode } from "react";
import LandingNav from "@/components/landing/LandingNav";
import "@/app/landing.css";

/**
 * Shared shell for the static legal pages (/terms, /privacy). Landing nav on
 * top, a readable centred article, and the standard footer links.
 */
export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div
      className="lp"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#faf8f4",
      }}
    >
      <LandingNav />

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 760,
          margin: "0 auto",
          // Clear the fixed 64px landing nav.
          padding: "104px 24px 64px",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
          color: "#4a4a47",
        }}
      >
        <h1
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontSize: 36,
            fontWeight: 400,
            color: "#0e0e0d",
            lineHeight: 1.15,
          }}
        >
          {title}
        </h1>
        <p style={{ marginTop: 8, fontSize: 13, color: "#8a8a85" }}>
          Last updated {updated}
        </p>

        <div className="legal-body" style={{ marginTop: 28 }}>
          {children}
        </div>

        <p style={{ marginTop: 40, fontSize: 13, color: "#8a8a85" }}>
          Questions? Email{" "}
          <a href="mailto:support@fundi.mosesochacha.online" style={{ color: "#a8872e" }}>
            support@fundi.mosesochacha.online
          </a>
          .
        </p>
      </main>

      <footer
        style={{
          borderTop: "0.5px solid #e5e0d5",
          padding: "20px 24px",
          display: "flex",
          gap: 16,
          justifyContent: "center",
          fontSize: 13,
          color: "#8a8a85",
        }}
      >
        <span>© 2026 Fundi</span>
        <Link href="/privacy" style={{ color: "#8a8a85" }}>
          Privacy
        </Link>
        <Link href="/terms" style={{ color: "#8a8a85" }}>
          Terms
        </Link>
      </footer>

      {/* Scoped typography for the article body */}
      <style>{`
        .legal-body h2 {
          font-family: var(--font-fraunces), Georgia, serif;
          font-size: 19px;
          font-weight: 500;
          color: #0e0e0d;
          margin: 28px 0 8px;
        }
        .legal-body p { font-size: 15px; line-height: 1.7; margin: 0 0 12px; }
        .legal-body ul { margin: 0 0 12px; padding-left: 20px; }
        .legal-body li { font-size: 15px; line-height: 1.7; margin-bottom: 6px; }
        .legal-body a { color: #a8872e; }
        .legal-body strong { color: #0e0e0d; }
      `}</style>
    </div>
  );
}
