import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
  allDicaSlugs,
  dicaFromSlug,
  DICA_CATEGORIES,
} from '@/lib/core/dicas/dica-catalog';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import { ArticleSchema } from '@/components/seo/article-schema';
import { FaqStructuredData } from '@/components/seo/faq-structured-data';
import { SITE } from '@/lib/core/constants';

export const revalidate = 86400;

export function generateStaticParams() {
  return allDicaSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dica = dicaFromSlug(slug);
  if (!dica) {
    return {
      title: { absolute: 'Dica não encontrada | Radar Unificando' },
    };
  }

  return {
    title: { absolute: `${dica.title} | Radar Unificando` },
    description: dica.description,
    alternates: { canonical: `${SITE.url}/dicas/${dica.slug}` },
    openGraph: {
      title: dica.title,
      description: dica.description,
      url: `${SITE.url}/dicas/${dica.slug}`,
      type: 'article',
      publishedTime: dica.publishDate,
      modifiedTime: dica.updateDate,
      siteName: 'Radar Unificando',
    },
  };
}

export default async function DicaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dica = dicaFromSlug(slug);
  if (!dica) notFound();

  const categoryLabel =
    DICA_CATEGORIES[dica.category]?.label ?? dica.category;
  const publishDateFormatted = new Date(dica.publishDate).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'long', year: 'numeric' },
  );

  return (
    <Box
      sx={{
        bgcolor: '#020617',
        color: '#ffffff',
        minHeight: '100vh',
        py: { xs: 6, md: 8 },
      }}
    >
      {/* FAQPage JSON-LD */}
      <FaqStructuredData
        items={dica.faq.map((f) => ({ q: f.question, a: f.answer }))}
      />

      {/* Article JSON-LD */}
      <ArticleSchema
        title={dica.title}
        description={dica.description}
        url={`${SITE.url}/dicas/${dica.slug}`}
        datePublished={dica.publishDate}
        dateModified={dica.updateDate}
      />

      <Container maxWidth="md">
        {/* Breadcrumb JSON-LD */}
        <BreadcrumbSchema
          items={[
            { name: 'Home', url: SITE.url },
            { name: 'Dicas', url: `${SITE.url}/dicas` },
            { name: dica.title, url: `${SITE.url}/dicas/${dica.slug}` },
          ]}
        />

        {/* Breadcrumb visível */}
        <Box
          component="nav"
          aria-label="breadcrumb"
          sx={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#94a3b8',
            mb: 3,
          }}
        >
          <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>
            HOME
          </Link>
          {' / '}
          <Link
            href="/dicas"
            style={{ color: '#94a3b8', textDecoration: 'none' }}
          >
            DICAS
          </Link>
          {' / '}
          <span style={{ color: '#ccff00' }}>{dica.title}</span>
        </Box>

        {/* Badge + Reading time */}
        <Box
          sx={{
            display: 'inline-block',
            bgcolor: '#0f172a',
            color: '#ccff00',
            fontWeight: 900,
            fontSize: '0.65rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            fontFamily: 'ui-monospace, monospace',
            px: 1.5,
            py: 0.5,
            border: '2px solid #334155',
            mb: 2,
          }}
        >
          {categoryLabel}
        </Box>
        <Typography
          sx={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.75rem',
            color: '#94a3b8',
            fontWeight: 800,
            mb: 2,
          }}
        >
          {dica.estimatedReadingMinutes} min de leitura · Publicado em{' '}
          {publishDateFormatted}
        </Typography>

        {/* H1 */}
        <Typography
          component="h1"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '1.8rem', sm: '2.5rem' },
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            mb: 2,
            color: '#ffffff',
          }}
        >
          {dica.title}
        </Typography>
        <Typography variant="body1" sx={{ color: '#94a3b8', mb: 4 }}>
          {dica.description}
        </Typography>

        {/* Seções de conteúdo */}
        {dica.sections.map((section) => (
          <Box key={section.heading} component="section" sx={{ mb: 4 }}>
            <Typography
              component="h2"
              sx={{
                fontWeight: 800,
                fontSize: '1.25rem',
                color: '#ccff00',
                mb: 1,
              }}
            >
              {section.heading}
            </Typography>
            {section.paragraphs?.map((p, i) => (
              <Typography
                key={i}
                sx={{ color: '#e2e8f0', fontSize: '0.9rem', mb: 1 }}
              >
                {p}
              </Typography>
            ))}
            {section.list && (
              <ul
                style={{
                  color: '#e2e8f0',
                  fontSize: '0.9rem',
                  paddingLeft: 20,
                  lineHeight: 1.8,
                }}
              >
                {section.list.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </Box>
        ))}

        {/* FAQ */}
        <Box component="section" sx={{ mb: 4 }}>
          <Typography
            component="h2"
            sx={{
              fontWeight: 800,
              fontSize: '1.25rem',
              color: '#ccff00',
              mb: 2,
            }}
          >
            Perguntas frequentes
          </Typography>
          {dica.faq.map((f) => (
            <Box key={f.question} sx={{ mb: 2 }}>
              <Typography
                sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.9rem' }}
              >
                {f.question}
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                {f.answer}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* CTA */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 5,
            p: 4,
            border: '2px solid #ccff00',
            boxShadow: '6px 6px 0px #ccff00',
            bgcolor: '#0f172a',
          }}
        >
          <Typography
            sx={{
              fontWeight: 900,
              fontSize: '1.1rem',
              textTransform: 'uppercase',
              color: '#ccff00',
              mb: 2,
            }}
          >
            APLIQUE ESSAS DICAS AGORA
          </Typography>
          <Typography
            sx={{ color: '#94a3b8', fontSize: '0.85rem', mb: 3 }}
          >
            Importe seu currículo e receba o score ATS gratuito com análise
            detalhada.
          </Typography>
          <Link
            href="/perfil"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '44px',
              backgroundColor: '#ccff00',
              color: '#020617',
              padding: '14px 28px',
              fontWeight: 900,
              textTransform: 'uppercase',
              fontSize: '0.85rem',
              fontFamily: 'ui-monospace, monospace',
              textDecoration: 'none',
              boxShadow: '4px 4px 0px #ffffff',
            }}
          >
            IMPORTAR CURRÍCULO AGORA
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
