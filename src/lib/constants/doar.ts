// Configuração da página de doação (separada da UI).
import { Coffee, Server, Cpu, Zap, Globe } from 'lucide-react';

export const PIX_BRCODE =
  '00020126580014br.gov.bcb.pix013627f32c37-5109-47c2-a539-fe9fe58b4eb85204000053039865802BR5914RENATO BEZERRA6006RECIFE62070503***630475E5';
export const PIX_KEY = '27f32c37-5109-47c2-a539-fe9fe58b4eb8';

export const SUGGESTED_VALUES = [
  {
    icon: Coffee,
    label: 'R$ 5',
    title: 'CAFÉ DO DEV',
    desc: 'Ajuda a pagar o café durante as madrugadas de código.',
  },
  {
    icon: Server,
    label: 'R$ 15',
    title: 'SERVIDORES 24H',
    desc: 'Mantém o banco de dados e as buscas ao vivo no ar.',
  },
  {
    icon: Cpu,
    label: 'R$ 30',
    title: 'TOKENS DE IA',
    desc: 'Financia os modelos de IA para cálculos ATS e Chat.',
  },
  {
    icon: Zap,
    label: 'R$ 50+',
    title: 'SUPER APOIO',
    desc: 'Garante o desenvolvimento contínuo de novas funções.',
  },
];

export const TRANSPARENCY_ITEMS = [
  {
    icon: Server,
    title: 'INFRAESTRUTURA 24H',
    desc: 'Hospedagem de alto desempenho, banco de dados PostgreSQL e servidores de busca ao vivo.',
  },
  {
    icon: Cpu,
    title: 'MODELOS DE IA GENERATIVA',
    desc: 'Custo por token dos modelos de inteligência artificial para simulação de entrevistas e score ATS.',
  },
  {
    icon: Globe,
    title: 'EXTENSÃO CHROME',
    desc: 'Manutenção da extensão do navegador, suporte a novas plataformas e atualizações de segurança.',
  },
];
