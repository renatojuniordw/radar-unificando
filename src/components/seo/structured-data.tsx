import { FAQ_ITEMS } from "@/lib/constants/home";

export function StructuredData() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Radar Unificando",
    alternateName: "Radar de Vagas Gupy & InHire",
    url: "https://radar.unificando.com.br",
    description:
      "Busca automática de vagas em Gupy e InHire em tempo real para cargos de TI, Dados, Marketing e Vendas.",
    inLanguage: "pt-BR",
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Radar Unificando",
    url: "https://radar.unificando.com.br",
    logo: "https://radar.unificando.com.br/logo.png",
    sameAs: [],
    description:
      "Plataforma unificada de busca e recomendação inteligente de vagas em tempo real.",
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Radar Unificando",
    url: "https://radar.unificando.com.br",
    applicationCategory: "BusinessApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript. Requires HTML5.",
    offers: {
      "@type": "Offer",
      price: "0.00",
      priceCurrency: "BRL",
    },
    description:
      "Buscador e agregador automático de vagas de emprego que unifica as plataformas Gupy e InHire em tempo real com inteligência artificial.",
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
