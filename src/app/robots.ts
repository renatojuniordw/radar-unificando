import type { MetadataRoute } from "next";
import { SITE } from "@/lib/core/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/perfil/", "/admin/", "/export/"],
      },
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Google-Extended",
        ],
        allow: "/",
        disallow: ["/api/", "/perfil/", "/admin/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
