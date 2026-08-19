import { SITE } from '@/lib/core/constants';
import { toScriptJson } from '@/lib/core/seo/jsonld';

export function StructuredData() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Radar Unificando",
    alternateName: "Radar de Vagas Gupy & InHire",
    url: SITE.url,
    description:
      "Busca automática de vagas em Gupy e InHire em tempo real para cargos de TI, Dados, Marketing e Vendas.",
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/busca?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Radar Unificando",
    url: SITE.url,
    logo: SITE.logo,
    sameAs: [],
    description:
      "Plataforma unificada de busca e recomendação inteligente de vagas em tempo real.",
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Radar Unificando",
    url: SITE.url,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toScriptJson(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toScriptJson(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toScriptJson(webAppSchema) }}
      />
    </>
  );
}
