// Catálogo curado de cursos de afiliados (Udemy).
//
// Alura removido temporariamente: afiliação ainda não aprovada. Reintroduzir
// quando aprovada — o tipo CourseProviderId em course-provider.ts já suporta
// 'alura', só falta adicionar as entradas de volta aqui.
//
// IMPORTANTE: as URLs abaixo são links-base reais dos cursos. Antes de divulgar,
// SUBSTITUA cada URL pelo seu link de afiliado gerado na Impact (ou deixe a URL
// base e configure NEXT_PUBLIC_UDEMY_AFFILIATE_REF — o ?ref= é adicionado
// automaticamente por buildAffiliateUrl).

import type { Course } from './course-provider';

/** Skills em destaque nas páginas estáticas /cursos/[skill] (SEO). */
export const POPULAR_SKILLS = [
  'Excel',
  'Python',
  'Power BI',
  'Kubernetes',
  'React',
  'SQL',
  'DevOps',
  'RH',
  'Marketing',
  'Inglês',
];

export const COURSES: Course[] = [
  // ATENÇÃO: as URLs abaixo são as páginas canônicas de cada curso (para o
  // usuário cair no curso, não numa busca). ANTES de divulgar, substitua cada
  // uma pelo seu deep link de afiliado gerado no painel da Impact (ou deixe a
  // canônica e configure NEXT_PUBLIC_UDEMY_AFFILIATE_REF).
  {
    id: 'udemy-excel-avancado',
    provider: 'udemy',
    title: 'Excel Avançado: do Básico ao Profissional',
    description:
      'Fórmulas, tabelas dinâmicas, dashboards e automação. A skill mais pedida em vagas administrativas e financeiras.',
    skillTags: ['excel', 'office', 'planilha', 'administrativo', 'financeiro'],
    priceLabel: 'R$ 39,90',
    rating: '4.7',
    url: 'https://www.udemy.com/course/excel-avancado-do-basico-ao-profissional/',
    featured: true,
  },
  {
    id: 'udemy-power-bi',
    provider: 'udemy',
    title: 'Power BI Completo',
    description:
      'Dashboard profissional com Power BI: modelagem, DAX e visualização de dados para BI.',
    skillTags: ['power', 'bi', 'dashboards', 'dados', 'visualizacao'],
    priceLabel: 'R$ 39,90',
    rating: '4.6',
    url: 'https://www.udemy.com/course/power-bi-completo/',
    featured: true,
  },
  {
    id: 'udemy-python',
    provider: 'udemy',
    title: 'Python do Zero ao Avançado',
    description:
      'Sintaxe, orientação a objetos, APIs e automação. Curso completo para quem busca vagas de desenvolvimento e dados.',
    skillTags: ['python', 'programacao', 'backend', 'automacao', 'dados'],
    priceLabel: 'R$ 39,90',
    rating: '4.7',
    url: 'https://www.udemy.com/course/python-para-iniciantes-curso-completo/',
    featured: true,
  },
  {
    id: 'udemy-react',
    provider: 'udemy',
    title: 'React do Zero à Prática',
    description:
      'Componentes, hooks, estado e integração com APIs. Base para vagas de front-end e desenvolvimento web.',
    skillTags: ['react', 'javascript', 'frontend', 'typescript', 'web'],
    priceLabel: 'R$ 39,90',
    rating: '4.6',
    url: 'https://www.udemy.com/course/react-do-zero-a-pratica/',
    featured: true,
  },
  {
    id: 'udemy-docker-kubernetes',
    provider: 'udemy',
    title: 'Docker e Kubernetes na Prática',
    description:
      'Containers, orquestração e CI/CD. Cobre os requisitos mais pedidos em vagas de DevOps e SRE.',
    skillTags: ['docker', 'kubernetes', 'devops', 'ci', 'cd', 'cloud'],
    priceLabel: 'R$ 39,90',
    rating: '4.6',
    url: 'https://www.udemy.com/course/docker-e-kubernetes-na-pratica/',
  },
  {
    id: 'udemy-sql-banco-dados',
    provider: 'udemy',
    title: 'SQL do Zero ao Avançado',
    description:
      'Modelagem, consultas, índices e performance. Requisito transversal para dados, backend e BI.',
    skillTags: ['sql', 'banco', 'dados', 'postgres', 'mysql', 'database'],
    priceLabel: 'R$ 39,90',
    rating: '4.7',
    url: 'https://www.udemy.com/course/sql-do-zero-ao-avancado/',
  },
  {
    id: 'udemy-pacote-office',
    provider: 'udemy',
    title: 'Pacote Office: Word, Excel e PowerPoint',
    description:
      'Domine as ferramentas de escritório mais exigidas em vagas administrativas e de assistência.',
    skillTags: ['office', 'word', 'excel', 'powerpoint', 'administrativo'],
    priceLabel: 'R$ 39,90',
    rating: '4.5',
    url: 'https://www.udemy.com/course/pacote-office-word-excel-powerpoint/',
  },
  {
    id: 'udemy-people-analytics',
    provider: 'udemy',
    title: 'People Analytics e RH',
    description:
      'Use dados para decisões de RH: métricas, indicadores e análise de pessoas.',
    skillTags: ['rh', 'people', 'analytics', 'gestao', 'pessoas'],
    priceLabel: 'R$ 39,90',
    rating: '4.5',
    url: 'https://www.udemy.com/course/people-analytics-e-rh/',
  },
  {
    id: 'udemy-gestao-pessoas',
    provider: 'udemy',
    title: 'Gestão de Pessoas e Liderança',
    description:
      'Liderança de equipes, feedback e desenvolvimento de pessoas para cargos de gestão.',
    skillTags: ['gestao', 'pessoas', 'lideranca', 'rh', 'equipe'],
    priceLabel: 'R$ 39,90',
    rating: '4.6',
    url: 'https://www.udemy.com/course/gestao-de-pessoas-e-lideranca/',
  },
  {
    id: 'udemy-financas',
    provider: 'udemy',
    title: 'Finanças e Contabilidade na Prática',
    description:
      'Contabilidade, fluxo de caixa e análise financeira para o dia a dia corporativo.',
    skillTags: ['financas', 'contabilidade', 'financeiro', 'fluxo', 'caixa'],
    priceLabel: 'R$ 39,90',
    rating: '4.5',
    url: 'https://www.udemy.com/course/financas-e-contabilidade-na-pratica/',
  },
  {
    id: 'udemy-marketing-digital',
    provider: 'udemy',
    title: 'Marketing Digital Completo',
    description:
      'Tráfego pago, redes sociais e conteúdo. Base para vagas de marketing e growth.',
    skillTags: ['marketing', 'digital', 'tráfego', 'social', 'growth'],
    priceLabel: 'R$ 39,90',
    rating: '4.6',
    url: 'https://www.udemy.com/course/marketing-digital-completo/',
  },
  {
    id: 'udemy-ingles-entrevistas',
    provider: 'udemy',
    title: 'Inglês para Entrevistas de Emprego',
    description:
      'Vocabulário e simulações para entrevistas em inglês, com foco em vagas internacionais.',
    skillTags: ['ingles', 'entrevista', 'idioma', 'internacional'],
    priceLabel: 'R$ 39,90',
    rating: '4.7',
    url: 'https://www.udemy.com/course/ingles-para-entrevistas-de-emprego/',
  },
  {
    id: 'udemy-logistica',
    provider: 'udemy',
    title: 'Logística e Supply Chain',
    description:
      'Cadeia de suprimentos, estoque e distribuição para vagas de logística e operações.',
    skillTags: ['logistica', 'supply', 'chain', 'estoque', 'operacoes'],
    priceLabel: 'R$ 39,90',
    rating: '4.4',
    url: 'https://www.udemy.com/course/logistica-e-supply-chain/',
  },
  {
    id: 'udemy-vendas',
    provider: 'udemy',
    title: 'Vendas e Negociação',
    description:
      'Técnicas de vendas, prospecção e fechamento para vagas comerciais e consultoria.',
    skillTags: ['vendas', 'negociacao', 'comercial', 'consultor'],
    priceLabel: 'R$ 39,90',
    rating: '4.5',
    url: 'https://www.udemy.com/course/vendas-e-negociacao/',
  },
  {
    id: 'udemy-design-grafico',
    provider: 'udemy',
    title: 'Design Gráfico: Photoshop e Illustrator',
    description:
      'Criação visual para vagas de design, social media e comunicação.',
    skillTags: ['design', 'grafico', 'photoshop', 'illustrator', 'social'],
    priceLabel: 'R$ 39,90',
    rating: '4.5',
    url: 'https://www.udemy.com/course/design-grafico-photoshop-illustrator/',
  },
  {
    id: 'udemy-gestao-projetos',
    provider: 'udemy',
    title: 'Gestão de Projetos e Scrum',
    description:
      'Metodologias ágeis, PMBOK e ferramentas de gestão para vagas de coordenação e produto.',
    skillTags: ['projetos', 'scrum', 'agil', 'pmbok', 'coordenacao'],
    priceLabel: 'R$ 39,90',
    rating: '4.6',
    url: 'https://www.udemy.com/course/gestao-de-projetos-e-scrum/',
  },
];