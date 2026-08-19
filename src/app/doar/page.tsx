import type { Metadata } from 'next';
import DoarContent from './doar-content';
import { SITE } from '@/lib/core/constants';

export const metadata: Metadata = {
  title: { absolute: 'Ajude a Manter o Projeto — Doe via PIX | Radar Unificando' },
  description:
    'Apoie o Radar Unificando com um PIX de qualquer valor. O projeto é gratuito e mantido por um único desenvolvedor — cada busca e conversa com a IA tem custo real.',
  alternates: { canonical: `${SITE.url}/doar` },
  openGraph: {
    title: 'Apoie o Radar Unificando — Doe via PIX',
    description:
      'Apoie o Radar Unificando com um PIX de qualquer valor — o projeto é 100% gratuito e mantido por doações.',
  },
};

export default function DoarPage() {
  return <DoarContent />;
}
