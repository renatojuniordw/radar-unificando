import { SITE } from '@/lib/core/constants';
import { toScriptJson } from '@/lib/core/seo/jsonld';

export interface ArticleSchemaProps {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
  image?: string;
}

export function ArticleSchema({
  title,
  description,
  url,
  datePublished,
  dateModified,
  authorName = 'Radar Unificando',
  image = SITE.logo,
}: ArticleSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    url,
    image,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: SITE.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Radar Unificando',
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: SITE.logo,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: toScriptJson(schema) }}
    />
  );
}
