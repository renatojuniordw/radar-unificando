import type { MetadataRoute } from "next";
import { COURSES, POPULAR_SKILLS } from "@/lib/core/courses/course-catalog";
import { skillSlug } from "@/lib/core/courses/course-matcher";
import { SITE } from "@/lib/core/constants";

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = SITE.url;
  // Data fixa para permitir cache estático do sitemap
  const lastModified = "2026-08-04";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "daily", priority: 1.0 },
    {
      url: `${base}/busca`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/cursos`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/guia-ats`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/sobre`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${base}/extensao`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${base}/termos`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // Rotas de cursos por skill (páginas estáticas indexáveis — SEO de afiliado)
  const skillSlugs = new Set<string>();
  COURSES.forEach((c) =>
    c.skillTags.forEach((t) => skillSlugs.add(skillSlug(t))),
  );
  POPULAR_SKILLS.forEach((s) => skillSlugs.add(skillSlug(s)));
  const courseRoutes: MetadataRoute.Sitemap = [...skillSlugs].map((slug) => ({
    url: `${base}/cursos/${slug}`,
    lastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...courseRoutes];
}
