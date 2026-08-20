import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SITE } from '@/lib/core/constants';
import {
  DICA_CATALOG,
  DICA_CATEGORIES,
  type DicaCategory,
} from '@/lib/core/dicas/dica-catalog';
import { DicaCardGrid } from '@/components/dicas/dica-card-grid';
import { DicaCard } from '@/components/dicas/dica-card';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: {
    absolute:
      'Dicas de Carreira, Currículo e Entrevista | Radar Unificando',
  },
  description:
    'Tutoriais e dicas práticas para otimizar seu currículo, passar nos filtros ATS, se preparar para entrevistas e encontrar melhores oportunidades.',
  alternates: { canonical: `${SITE.url}/dicas` },
  openGraph: {
    title: 'Dicas de Carreira e Currículo — Radar Unificando',
    description:
      'Tutoriais e dicas para otimizar seu currículo, passar no ATS e se preparar para entrevistas.',
    url: `${SITE.url}/dicas`,
    type: 'website',
  },
};

const VALID_CATEGORIES = new Set<string>(
  Object.keys(DICA_CATEGORIES) as DicaCategory[],
);

export default function DicasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const activeCategory =
    categoria && VALID_CATEGORIES.has(categoria)
      ? (categoria as DicaCategory)
      : null;

  const filteredDicas = activeCategory
    ? DICA_CATALOG.filter(
        (d) =>
          d.category === activeCategory ||
          d.secondCategory === activeCategory,
      )
    : DICA_CATALOG;

  return (
    <Box sx={{ bgcolor: '#020617', color: '#ffffff', minHeight: '100vh' }}>
      <Container
        maxWidth="xl"
        sx={{ py: { xs: 5, md: 8 }, px: { xs: 2, sm: 3 } }}
      >
        {/* Badge */}
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
          DICAS E TUTORIAIS
        </Box>

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
          DICAS PARA ACELERAR SUA CARREIRA
        </Typography>
        <Typography
          sx={{ color: '#94a3b8', mb: 4, maxWidth: '600px' }}
        >
          Tutoriais práticos para otimizar seu currículo, passar nos filtros
          automáticos e se preparar para entrevistas.
        </Typography>

        {/* Category chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
          <Link href="/dicas" style={{ textDecoration: 'none' }}>
            <Box
              sx={{
                display: 'inline-block',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.7rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: !activeCategory ? '#020617' : '#94a3b8',
                bgcolor: !activeCategory ? '#ccff00' : 'transparent',
                border: `2px solid ${!activeCategory ? '#ccff00' : '#334155'}`,
                px: 1.5,
                py: 0.5,
                '&:hover': {
                  borderColor: '#ccff00',
                  color: '#ccff00',
                },
              }}
            >
              Todas
            </Box>
          </Link>
          {Object.entries(DICA_CATEGORIES).map(([key, cat]) => {
            const isActive = activeCategory === key;
            return (
              <Link
                key={key}
                href={`/dicas?categoria=${key}`}
                style={{ textDecoration: 'none' }}
              >
                <Box
                  sx={{
                    display: 'inline-block',
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: isActive ? '#020617' : '#94a3b8',
                    bgcolor: isActive ? '#ccff00' : 'transparent',
                    border: `2px solid ${isActive ? '#ccff00' : '#334155'}`,
                    px: 1.5,
                    py: 0.5,
                    '&:hover': {
                      borderColor: '#ccff00',
                      color: '#ccff00',
                    },
                  }}
                >
                  {cat.label}
                </Box>
              </Link>
            );
          })}
        </Box>

        {/* Card grid */}
        <DicaCardGrid>
          {filteredDicas.map((dica) => (
            <DicaCard key={dica.slug} dica={dica} />
          ))}
        </DicaCardGrid>

        {/* CTA */}
        <Box
          sx={{
            textAlign: 'center',
            mt: 6,
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
            PRONTO PARA PÔR EM PRÁTICA?
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
