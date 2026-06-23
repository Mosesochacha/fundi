import type { Metadata } from "next";
import localFont from "next/font/local";
import Providers from "@/components/Providers";
import LayoutShell from "@/components/LayoutShell";
import { ToastProvider } from "@/context/ToastContext";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

const playfair = localFont({
  src: [
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-900-normal.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = localFont({
  src: [
    { path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-300-normal.woff2", weight: "300", style: "normal" },
    { path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../../node_modules/@fontsource/dm-sans/files/dm-sans-latin-800-normal.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Fundi — Kenya's Professional Community", template: "%s | Fundi" },
  description: "Where skilled professionals showcase their work and connect with customers across Kenya.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${playfair.variable} ${dmSans.variable} antialiased font-dm-sans text-[color:var(--ink)]`}
        style={{ background: "var(--orange-25)" }}
      >
        <PostHogProvider>
          <ToastProvider>
            <Providers>
              <LayoutShell>{children}</LayoutShell>
            </Providers>
          </ToastProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
