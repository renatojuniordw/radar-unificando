import type { Metadata } from 'next';
import { SITE } from '@/lib/core/constants';

export const metadata: Metadata = {
  title: 'Cursos para fechar seus gaps — Udemy | Radar Unificando',
  description:
    'Cursos recomendados da Udemy com base nas skills exigidas pelas vagas que você busca. Feche as lacunas do currículo com cursos avulsos baratos.',
  alternates: { canonical: `${SITE.url}/cursos` },
  openGraph: {
    title: 'Cursos para fechar seus gaps — Udemy | Radar Unificando',
    description:
      'Estude exatamente a skill que falta no seu currículo com cursos da Udemy.',
    url: `${SITE.url}/cursos`,
    type: 'website',
  },
};

export default function CursosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
