import type { Metadata } from 'next';
import { SITE } from '@/lib/core/constants';

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

export default function DicasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
