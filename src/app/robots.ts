import type { MetadataRoute } from "next";

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
    sitemap: "https://radar.unificando.com.br/sitemap.xml",
  };
}
