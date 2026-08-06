import type { Metadata } from 'next';
import DoarContent from './doar-content';

export const metadata: Metadata = {
  title: 'Doar | Radar Unificando',
  description:
    'Apoie o Radar Unificando com um PIX de qualquer valor. O projeto é gratuito e mantido por um único desenvolvedor — cada busca e conversa com a IA tem custo real.',
  openGraph: {
    title: 'Doar | Radar Unificando',
    description:
      'Apoie o Radar Unificando com um PIX de qualquer valor — o projeto é 100% gratuito e mantido por doações.',
  },
};

export default function DoarPage() {
  return <DoarContent />;
}
