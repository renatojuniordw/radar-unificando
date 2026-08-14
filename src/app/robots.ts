import type { MetadataRoute } from "next";
import { SITE } from "@/lib/core/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/perfil/", "/export/"],
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
        disallow: ["/api/", "/perfil/"],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
