import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://radar.unificando.com.br";
  // Data fixa para permitir cache estático do sitemap
  const lastModified = "2026-08-04";

  return [
    {
      url: base,
      lastModified,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${base}/sobre`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/termos`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/login`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/register`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}