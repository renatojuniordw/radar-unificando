import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Box, Container, Typography } from '@mui/material';
import Link from 'next/link';
import { allSkillSlugs, skillFromSlug, coursesForSlug } from '@/lib/core/courses/course-skills';
import { CourseCard } from '@/components/cursos/course-card';
import { CourseGrid } from '@/components/cursos/course-grid';

export const revalidate = 86400; // ISR: regenera a cada 24h

export function generateStaticParams() {
  return allSkillSlugs().map((slug) => ({ skill: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ skill: string }>;
}): Promise<Metadata> {
  const { skill } = await params;
  const courses = coursesForSlug(skill);
  if (courses.length === 0) return { title: 'Curso não encontrado | Radar Unificando' };
  const name = skillFromSlug(skill);
  return {
    title: `Curso de ${name} — Alura e Udemy | Radar Unificando`,
    description: `Cursos de ${name} recomendados para fechar os gaps do seu currículo: trilha completa na Alura ou curso avulso barato na Udemy.`,
    alternates: { canonical: `https://radar.unificando.com.br/cursos/${skill}` },
    openGraph: {
      title: `Curso de ${name} — Alura e Udemy`,
      description: `Cursos de ${name} para fechar os gaps do seu currículo.`,
      url: `https://radar.unificando.com.br/cursos/${skill}`,
      type: 'website',
    },
  };
}

export default async function SkillPage({
  params,
}: {
  params: Promise<{ skill: string }>;
}) {
  const { skill } = await params;
  const courses = coursesForSlug(skill);
  if (courses.length === 0) notFound();
  const name = skillFromSlug(skill);

  return (
    <Box sx={{ bgcolor: '#020617', color: '#ffffff', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 }, px: { xs: 2, sm: 3 } }}>
        <Link
          href="/cursos"
          style={{
            color: '#94a3b8',
            fontFamily: 'ui-monospace, monospace',
            fontSize: '0.7rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            textDecoration: 'none',
          }}
        >
          ← Todos os cursos
        </Link>

        <Box sx={{ mt: 3, mb: 5, maxWidth: 720 }}>
          <Box className="badge-neon" sx={{ mb: 2 }}>
            ALURA + UDEMY · LINKS DE AFILIADO
          </Box>
          <Typography
            component="h1"
            sx={{
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#ccff00',
              fontSize: { xs: '1.9rem', sm: '2.75rem' },
              lineHeight: 1,
              textTransform: 'uppercase',
              mb: 1.5,
            }}
          >
            Cursos de {name}
          </Typography>
          <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6 }}>
            As vagas que você busca pedem {name.toLowerCase()}. Estude exatamente
            essa skill — curso avulso barato na Udemy ou trilha completa na Alura.
          </Typography>
        </Box>

        <CourseGrid>
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </CourseGrid>

        <Typography
          sx={{
            mt: 6,
            pt: 3,
            borderTop: '1px solid #1e293b',
            color: '#475569',
            fontSize: '0.7rem',
            lineHeight: 1.6,
            maxWidth: 720,
          }}
        >
          Alguns links desta página são de afiliados (Alura e Udemy) e podem
          gerar comissão para a manutenção do projeto, sem custo adicional para
          você.
        </Typography>
      </Container>
    </Box>
  );
}
