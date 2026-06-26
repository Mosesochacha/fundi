import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/moderator/",
        "/employer/",
        "/onboarding",
        "/api/",
        // Worker app pages (dashboard, settings, etc.) — public /worker/[id]
        // profiles stay crawlable.
        "/worker/dashboard",
        "/worker/messages",
        "/worker/profile",
        "/worker/requests",
        "/worker/reviews",
        "/worker/settings",
        // Transient auth screens (login/register stay crawlable + in sitemap).
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
