import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { publicJobRepository } from '@/lib/infrastructure/repositories';
import { JobPostingSchema, type JobPostingData } from '@/components/seo/job-posting-schema';
import { slugify } from '@/lib/core/vagas/slug';
import { SITE } from '@/lib/core/constants';

export const revalidate = 3600; // ISR: regenera a cada 1h

export async function generateStaticParams() {
  try {
    const categories = await publicJobRepository.findRoleCategories();
    return categories.map((c) => ({ cargo: slugify(c.roleCategory) }));
  } catch {
    // Banco pode estar indisponível durante o build (ex.: build de imagem Docker sem
    // acesso à rede do Postgres). dynamicParams permanece true, então essas páginas
    // são geradas sob demanda na primeira requisição.
    return [];
  }
}

export async function generateMetadata({ params }: { params: Promise<{ cargo: string }> }): Promise<Metadata> {
  const { cargo } = await params;
  const categories = await publicJobRepository.findRoleCategories();
  const match = categories.find((c) => slugify(c.roleCategory) === cargo);
  const name = match?.roleCategory || cargo.replace(/-/g, ' ');
  return {
    title: `Vagas de ${name}`,
    description: `Vagas de ${name} agregadas de Gupy e InHire em tempo real.`,
    alternates: { canonical: `${SITE.url}/vagas/${cargo}` },
  };
}

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

export default async function VagasCategoriaPage({ params }: { params: Promise<{ cargo: string }> }) {
  const { cargo } = await params;
  const categories = await publicJobRepository.findRoleCategories();
  const match = categories.find((c) => slugify(c.roleCategory) === cargo);
  if (!match) notFound();

  const jobs = await publicJobRepository.findByRoleCategory(match.roleCategory, 100);
  const schemaJobs = jobs.slice(0, 10).map(toJobPosting);

  return (
    <Box sx={{ bgcolor: '#020617', color: '#ffffff', minHeight: '100vh', py: { xs: 6, md: 8 } }}>
      <JobPostingSchema jobs={schemaJobs} />
      <Container maxWidth="lg">
        <Box sx={{ mb: 4 }}>
          <Link href="/vagas" style={{ color: '#ccff00', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', textDecoration: 'none' }}>
            ← Todas as vagas
          </Link>
        </Box>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            component="h1"
            sx={{ fontWeight: 900, fontSize: { xs: '2rem', sm: '2.75rem' }, letterSpacing: '-0.03em', textTransform: 'uppercase', mb: 1, color: '#ffffff' }}
          >
            VAGAS DE {match.roleCategory.toUpperCase()}
          </Typography>
          <Typography variant="body1" sx={{ color: '#94a3b8' }}>
            {jobs.length > 0 ? `${jobs.length} vagas ativas nesta categoria.` : 'Nenhuma vaga ativa nesta categoria no momento.'}
          </Typography>
        </Box>

        {jobs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
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