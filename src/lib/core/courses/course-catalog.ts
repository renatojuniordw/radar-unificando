// Catálogo curado de cursos de afiliados. Único provider: Udemy.
//
// IMPORTANTE: as URLs abaixo são páginas canônicas REAIS dos cursos (verificadas).
// O tracking de afiliado é feito pelo script da Impact carregado no client via
// CookieConsent (impactStat('transformLinks'), somente após consentimento de
// cookies), que reescreve links udemy.com no DOM. Se NEXT_PUBLIC_UDEMY_AFFILIATE_REF
// estiver setado, buildAffiliateUrl também adiciona ?ref= automaticamente.

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
  // ATENÇÃO: as URLs abaixo são as páginas canônicas REAIS de cada curso
  // (para o usuário cair no curso, não numa busca). Tracking via script Impact
  // no client + buildAffiliateUrl quando NEXT_PUBLIC_UDEMY_AFFILIATE_REF.
  {
    id: 'udemy-excel-avancado',
    provider: 'udemy',
    title: 'Excel Avançado: do Básico ao Profissional',
    description:
      'Fórmulas, tabelas dinâmicas, dashboards e automação. A skill mais pedida em vagas administrativas e financeiras.',
    skillTags: ['excel', 'office', 'planilha', 'administrativo', 'financeiro'],
    priceLabel: 'R$ 39,90',
    rating: '4.7',
    url: 'https://www.udemy.com/course/curso-excel-completo/',
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
    url: 'https://www.udemy.com/course/power-bi-completo-do-basico-ao-avancado/',
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
    url: 'https://www.udemy.com/course/python-3-do-zero-ao-avancado/',
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
    url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/',
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
    url: 'https://www.udemy.com/course/docker-e-kubernetes-de-forma-pratica-e-direta/',
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
    url: 'https://www.udemy.com/course/curso-sql-do-zero-ao-avancado/',
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
    url: 'https://www.udemy.com/course/complete-microsoft-office-masterclass-word-excel-powerpoint/',
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
    url: 'https://www.udemy.com/course/recursos-humanos-analytics-i-people-analytics-em-rh/',
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
    url: 'https://www.udemy.com/course/curso-de-gestao-de-pessoas-e-lideranca/',
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
    url: 'https://www.udemy.com/course/contabilidade-financeira-e-tributaria/',
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
    url: 'https://www.udemy.com/course/logistics-and-supply-chains/',
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
    url: 'https://www.udemy.com/course/master-em-negociacao-e-vendas/',
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
    url: 'https://www.udemy.com/course/photoshop-e-illustrator/',
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
    url: 'https://www.udemy.com/course/gestao-projetos-gestao-agil-scrum-pmbok/',
  },
];