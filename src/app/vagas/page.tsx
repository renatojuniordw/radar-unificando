import type { Metadata } from 'next';
import Link from 'next/link';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { publicJobRepository } from '@/lib/infrastructure/repositories';
import { JobPostingSchema, type JobPostingData } from '@/components/seo/job-posting-schema';
import { slugify } from '@/lib/core/vagas/slug';
import { SITE } from '@/lib/core/constants';

export const revalidate = 3600; // ISR: regenera a cada 1h

export const metadata: Metadata = {
  title: 'Vagas de Tecnologia e Dados',
  description:
    'Consulte as vagas mais recentes de tecnologia, dados, produto e mais, agregadas de Gupy e InHire em tempo real.',
  alternates: { canonical: `${SITE.url}/vagas` },
};

function toJobPosting(job: {
  title: string | null;
  company: string;
  location: string | null;
  type: string | null;
  link: string;
  postedAt: string | null;
  description: string | null;
}): JobPostingData {
  return {
    title: job.title || 'Vaga',
    company: job.company,
    location: job.location || 'Brasil',
    type: job.type || 'FULL_TIME',
    url: job.link,
    datePosted: job.postedAt || undefined,
    description: job.description || undefined,
  };
}

export default async function VagasPage() {
  // Banco pode estar indisponível durante o build (ex.: build de imagem Docker sem
  // acesso à rede do Postgres). Falha aberta para não quebrar o build estático.
  const [jobs, categories] = await Promise.all([
    publicJobRepository.findPublic(200).catch(() => []),
    publicJobRepository.findRoleCategories().catch(() => []),
  ]);

  const schemaJobs = jobs.slice(0, 10).map(toJobPosting);

  return (
    <Box sx={{ bgcolor: '#020617', color: '#ffffff', minHeight: '100vh', py: { xs: 6, md: 8 } }}>
      <JobPostingSchema jobs={schemaJobs} />
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            component="h1"
            sx={{ fontWeight: 900, fontSize: { xs: '2rem', sm: '3rem' }, letterSpacing: '-0.03em', textTransform: 'uppercase', mb: 1, color: '#ffffff' }}
          >
            VAGAS AGREGADAS
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 560, mx: 'auto' }}>
            {jobs.length > 0
              ? `${jobs.length} vagas ativas de Gupy e InHire. Busque em tempo real em /busca ou navegue por categoria.`
              : 'Nenhuma vaga persistida no momento. Faça uma busca em tempo real em /busca.'}
          </Typography>
        </Box>

        {categories.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mb: 5 }}>
            {categories.map((c) => (
              <Link
                key={c.roleCategory}
                href={`/vagas/${slugify(c.roleCategory)}`}
                style={{ textDecoration: 'none' }}
              >
                <Box
                  sx={{
                    bgcolor: '#0f172a',
                    border: '2px solid #ccff00',
                    color: '#ccff00',
                    px: 2,
                    py: 1,
                    fontWeight: 900,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    '&:hover': { bgcolor: '#ccff00', color: '#020617' },
                  }}
                >
                  {c.roleCategory} ({c.count})
                </Box>
              </Link>
            ))}
          </Box>
        )}

        {jobs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: '#94a3b8', mb: 3 }}>Nenhuma vaga no momento.</Typography>
            <Link href="/busca" style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  display: 'inline-block',
                  bgcolor: '#ccff00',
                  color: '#020617',
                  px: 3,
                  py: 1.5,
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  boxShadow: '4px 4px 0px #ffffff',
                }}
              >
                Buscar vagas agora
              </Box>
            </Link>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2.5 }}>
            {jobs.map((job) => (
              <Box
                key={job.id}
                sx={{
                  bgcolor: '#0f172a',
                  border: '2px solid #1e293b',
                  p: 2.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  '&:hover': { borderColor: '#ccff00' },
                }}
              >
                <Typography sx={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem', lineHeight: 1.3 }}>
                  {job.title || 'Vaga'}
                </Typography>
                <Typography sx={{ color: '#ccff00', fontWeight: 700, fontSize: '0.8rem' }}>{job.company}</Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {[job.location, job.type].filter(Boolean).join(' · ') || 'Brasil'}
                </Typography>
                <Box sx={{ mt: 'auto', pt: 1 }}>
                  <a
                    href={job.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#ccff00', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}
                  >
                    Ver vaga →
                  </a>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}