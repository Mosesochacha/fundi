import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import LayoutShell from "@/components/LayoutShell";
import { ToastProvider } from "@/context/ToastContext";
import PostHogProvider from "@/components/PostHogProvider";
import "./globals.css";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: { default: "Fundi — Kenya's Professional Community", template: "%s | Fundi" },
  description: "Where skilled professionals showcase their work and connect with customers across Kenya.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable} antialiased`} style={{ background: "var(--orange-25)" }}>
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
