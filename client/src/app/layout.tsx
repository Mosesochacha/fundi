import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import Script from "next/script";
import LayoutShell from "@/components/LayoutShell";
import PostHogProvider from "@/components/PostHogProvider";
import Providers from "@/components/Providers";
import { ToastProvider } from "@/context/ToastContext";
import { SITE_URL } from "@/lib/seo";
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Tesilix - Hire Skilled Workers",
    template: "%s | Tesilix",
  },
  description:
    "The global marketplace where skilled workers showcase their work and connect with the people who need them.",
  applicationName: "Tesilix",
  openGraph: {
    type: "website",
    siteName: "Tesilix",
    url: SITE_URL,
    title: "Tesilix - Hire Skilled Workers",
    description:
      "The global marketplace where skilled workers showcase their work and connect with the people who need them.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tesilix - Hire Skilled Workers",
    description:
      "The global marketplace where skilled workers showcase their work and connect with the people who need them.",
  },
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-CRBGRHPE6V"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CRBGRHPE6V');
          `}
        </Script>
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
