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
        "/worker/dashboard",
        "/worker/messages",
        "/worker/profile",
        "/worker/requests",
        "/worker/reviews",
        "/worker/settings",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
