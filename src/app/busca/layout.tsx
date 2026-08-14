import type { Metadata } from 'next';
import { SITE } from '@/lib/core/constants';

export const metadata: Metadata = {
  title: 'Buscar vagas em tempo real — Gupy e InHire | Radar Unificando',
  description:
    'Busque vagas de Gupy e InHire em tempo real, veja o score de compatibilidade do seu currículo e descubra as skills que faltam para a vaga.',
  alternates: { canonical: `${SITE.url}/busca` },
  openGraph: {
    title: 'Buscar vagas em tempo real — Gupy e InHire | Radar Unificando',
    description:
      'Busque vagas de Gupy e InHire em tempo real e alinhe seu currículo com inteligência artificial.',
    url: `${SITE.url}/busca`,
    type: 'website',
  },
};

export default function BuscaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
