import type { Metadata } from 'next';
import DoarContent from './doar-content';

export const metadata: Metadata = {
  title: 'Apoie o projeto | Radar Unificando',
  description:
    'O Radar Unificando é gratuito e open source, mas tem custos reais de infraestrutura. Ajude a manter o projeto no ar com uma doação via PIX.',
};

export default function DoarPage() {
  return <DoarContent />;
}
