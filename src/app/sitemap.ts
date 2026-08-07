import type { MetadataRoute } from "next";
import { jobRepository } from "@/lib/infrastructure/repositories";
import { slugify } from "@/lib/core/vagas/slug";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://radar.unificando.com.br";
  // Data fixa para permitir cache estático do sitemap
  const lastModified = "2026-08-04";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "daily", priority: 1.0 },
    { url: `${base}/vagas`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/guia-ats`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/sobre`, lastModified, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/termos`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/login`, lastModified, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/register`, lastModified, changeFrequency: "monthly", priority: 0.5 },
  ];

  // Rotas dinâmicas de categorias de vagas (indexáveis — SEO)
  let categoryRoutes: MetadataRoute.Sitemap = [];
  try {
    const categories = await jobRepository.findRoleCategories();
    categoryRoutes = categories.map((c) => ({
      url: `${base}/vagas/${slugify(c.roleCategory)}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("[sitemap] Erro ao buscar categorias de vagas:", error);
  }

  return [...staticRoutes, ...categoryRoutes];
}
