import type { Metadata } from "next";
import HomeButton from "@/components/landing/HomeButton";
import LandingNav from "@/components/landing/LandingNav";
import "./landing.css";

export const metadata: Metadata = {
  title: "404 — Page not found | Fundi",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
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
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
        }}
      >
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          {/* 404 number with blurred gold shadow layer */}
          <div
            style={{
              position: "relative",
              display: "inline-block",
              marginBottom: 16,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 130,
                fontWeight: 400,
                color: "#c9a84c",
                letterSpacing: "-0.04em",
                opacity: 0.1,
                filter: "blur(12px)",
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              404
            </span>
            <span
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 130,
                fontWeight: 400,
                color: "#0d1b2a",
                letterSpacing: "-0.04em",
                lineHeight: 1,
                position: "relative",
              }}
            >
              404
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 26,
              fontWeight: 400,
              color: "#0d1b2a",
              marginBottom: 10,
              lineHeight: 1.2,
            }}
          >
            This page went{" "}
            <em
              style={{
                fontStyle: "italic",
                fontWeight: 300,
                color: "#c9a84c",
              }}
            >
              missing.
            </em>
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "#8a8a85",
              lineHeight: 1.7,
              marginBottom: 36,
            }}
          >
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>

          <HomeButton />
        </div>
      </main>

      <footer
        style={{
          padding: "20px 48px",
          borderTop: "0.5px solid #e5e0d5",
          textAlign: "center",
          fontSize: 11,
          color: "#c2bdb0",
        }}
      >
        Privacy · Terms
      </footer>
    </div>
  );
}
