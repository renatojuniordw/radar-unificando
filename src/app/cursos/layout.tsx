import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cursos para fechar seus gaps — Alura e Udemy | Radar Unificando',
  description:
    'Cursos recomendados de Alura e Udemy com base nas skills exigidas pelas vagas que você busca. Fechar as lacunas do currículo com trilhas completas ou cursos avulsos baratos.',
  alternates: { canonical: 'https://radar.unificando.com.br/cursos' },
  openGraph: {
    title: 'Cursos para fechar seus gaps — Alura e Udemy | Radar Unificando',
    description:
      'Estude exatamente a skill que falta no seu currículo com cursos da Alura e da Udemy.',
    url: 'https://radar.unificando.com.br/cursos',
    type: 'website',
  },
};

export default function CursosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
