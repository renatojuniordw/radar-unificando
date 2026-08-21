import { FAQ_ITEMS } from "@/lib/constants/home";
import { toScriptJson } from "@/lib/core/seo/jsonld";

export interface FaqItem {
  q: string;
  a: string;
}

// FAQPage não tem mais valor de rich result no Google (aposentado em
// 07/05/2026) — mantido apenas pelo eventual valor de citação em respostas de
// IA, não readicionar novas instâncias visando SERP. Aceita `items` para
// reuso em qualquer página com FAQ real (ex.: /dicas/[slug]); usa o FAQ da
// home como default para não quebrar o uso existente.
export function FaqStructuredData({ items = FAQ_ITEMS }: { items?: FaqItem[] }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toScriptJson(faqSchema) }}
    />
  );
}