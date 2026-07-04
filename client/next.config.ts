import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Inline the (small, ~18KB) global stylesheet into the HTML instead of a
  // render-blocking <link> — trades cross-page CSS caching for faster FCP/LCP.
  experimental: {
    inlineCss: true,
  },
  // Allow next/image to optimize worker avatars/portfolio photos. The API host
  // serves uploads; confirm/lock this down to the production media host before
  // launch (see SEO plan checklist).
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "**" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Allow the Google/Firebase sign-in popup to keep an opener reference
          // (signInWithPopup polls window.closed). Plain "same-origin" would sever
          // that link and break the popup; "...-allow-popups" keeps it working.
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
