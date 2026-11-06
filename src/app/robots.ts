import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/account", "/api/", "/auth/reset"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
