import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import LayoutShell from "@/components/LayoutShell";
import PostHogProvider from "@/components/PostHogProvider";
import Providers from "@/components/Providers";
import { ToastProvider } from "@/context/ToastContext";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tesilix — Hire Skilled Workers",
    template: "%s | Tesilix",
  },
  description:
    "The global marketplace where skilled workers showcase their work and connect with the people who need them.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${fraunces.variable} ${dmSans.variable} font-sans bg-cream text-ink antialiased`}
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
