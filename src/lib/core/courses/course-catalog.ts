// Catálogo curado de cursos de afiliados (Alura + Udemy).
//
// IMPORTANTE: as URLs abaixo são links-base reais dos cursos. Antes de divulgar,
// SUBSTITUA cada URL pelo seu link de afiliado:
//   - Alura: deep link gerado no painel da Awin (programa Alura BR, ID 23465).
//   - Udemy: deep link gerado na rede parceira (Rakuten/Impact) OU deixe a URL
//     base e configure NEXT_PUBLIC_UDEMY_AFFILIATE_REF — o ?ref= é adicionado
//     automaticamente por buildAffiliateUrl.
//
// Regra de curadoria: skills de formação ampla em tech → Alura (assinatura);
// ferramentas pontuais e áreas gerais → Udemy (curso avulso barato).

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
  // ===== ALURA (tech / formação ampla) =====
  {
    id: 'alura-python',
    provider: 'alura',
    title: 'Formação Python',
    description:
      'Do básico ao avançado: sintaxe, orientação a objetos, APIs e automação. Trilha completa para quem busca vagas de desenvolvimento.',
    skillTags: ['python', 'programacao', 'backend', 'automacao', 'dados'],
    priceLabel: 'Assinatura a partir de R$ 99/mês',
    rating: '4.9',
    url: 'https://www.alura.com.br/formacao-python',
    featured: true,
  },
  {
    id: 'alura-react',
    provider: 'alura',
    title: 'Formação React',
    description:
      'Componentes, hooks, estado e integração com APIs. Formação para vagas de front-end e desenvolvimento web.',
    skillTags: ['react', 'javascript', 'frontend', 'typescript', 'web'],
    priceLabel: 'Assinatura a partir de R$ 99/mês',
    rating: '4.8',
    url: 'https://www.alura.com.br/formacao-react-js',
    featured: true,
  },
  {
    id: 'alura-devops',
    provider: 'alura',
    title: 'Formação DevOps',
    description:
      'Docker, Kubernetes, CI/CD e infraestrutura como código. Cobre os requisitos mais pedidos em vagas de DevOps e SRE.',
    skillTags: ['docker', 'kubernetes', 'devops', 'ci', 'cd', 'cloud', 'aws'],
    priceLabel: 'Assinatura a partir de R$ 99/mês',
    rating: '4.8',
    url: 'https://www.alura.com.br/formacao-devops',
    featured: true,
  },
  {
    id: 'alura-data-science',
    provider: 'alura',
    title: 'Formação Data Science',
    description:
      'Python para dados, estatística, machine learning e visualização. Trilha para vagas de dados e IA.',
    skillTags: ['data', 'science', 'machine', 'learning', 'ia', 'python', 'analise'],
    priceLabel: 'Assinatura a partir de R$ 99/mês',
    rating: '4.9',
    url: 'https://www.alura.com.br/formacao-data-science',
    featured: true,
  },
  {
    id: 'alura-front-end',
    provider: 'alura',
    title: 'Formação Front-end',
    description:
      'HTML, CSS, JavaScript e boas práticas de interface. Base sólida para vagas de desenvolvimento web.',
    skillTags: ['html', 'css', 'javascript', 'frontend', 'web', 'ui'],
    priceLabel: 'Assinatura a partir de R$ 99/mês',
    rating: '4.7',
    url: 'https://www.alura.com.br/formacao-front-end',
  },
  {
    id: 'alura-nodejs',
    provider: 'alura',
    title: 'Formação Node.js',
    description:
      'APIs REST, bancos de dados e arquitetura de servidores com JavaScript. Para vagas de backend.',
    skillTags: ['node', 'javascript', 'backend', 'api', 'rest'],
    priceLabel: 'Assinatura a partir de R$ 99/mês',
    rating: '4.8',
    url: 'https://www.alura.com.br/formacao-node-js',
  },
  {
    id: 'alura-java',
    provider: 'alura',
    title: 'Formação Java',
    description:
      'Java do básico ao Spring Boot, com foco no mercado corporativo. Muito pedida em vagas de backend.',
    skillTags: ['java', 'spring', 'backend', 'programacao'],
    priceLabel: 'Assinatura a partir de R$ 99/mês',
    rating: '4.7',
    url: 'https://www.alura.com.br/formacao-java',
  },
  {
    id: 'alura-sql',
    provider: 'alura',
    title: 'Formação SQL e Banco de Dados',
    description:
      'Modelagem, consultas, índices e performance. Requisito transversal para dados, backend e BI.',
    skillTags: ['sql', 'banco', 'dados', 'postgres', 'mysql', 'database'],
    priceLabel: 'Assinatura a partir de R$ 99/mês',
    rating: '4.8',
    url: 'https://www.alura.com.br/formacao-sql-e-banco-de-dados',
  },
  {
    id: 'alura-ux',
    provider: 'alura',
    title: 'Formação UX Design',
    description:
      'Pesquisa, prototipação e design de interfaces. Para vagas de produto, UX e UI.',
    skillTags: ['ux', 'ui', 'design', 'produto', 'prototipacao'],
    priceLabel: 'Assinatura a partir de R$ 99/mês',
    rating: '4.7',
    url: 'https://www.alura.com.br/formacao-ux-design',
  },

  // ===== UDEMY (ferramentas pontuais / áreas gerais) =====
  {
    id: 'udemy-excel-avancado',
    provider: 'udemy',
    title: 'Excel Avançado: do Básico ao Profissional',
    description:
      'Fórmulas, tabelas dinâmicas, dashboards e automação. A skill mais pedida em vagas administrativas e financeiras.',
    skillTags: ['excel', 'office', 'planilha', 'administrativo', 'financeiro'],
    priceLabel: 'R$ 39,90',
    rating: '4.7',
    url: 'https://www.udemy.com/courses/search/?q=excel+avancado',
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
    url: 'https://www.udemy.com/courses/search/?q=power+bi',
    featured: true,
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
    url: 'https://www.udemy.com/courses/search/?q=pacote+office',
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
    url: 'https://www.udemy.com/courses/search/?q=people+analytics',
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
    url: 'https://www.udemy.com/courses/search/?q=gestao+de+pessoas',
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
    url: 'https://www.udemy.com/courses/search/?q=financas+contabilidade',
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
    url: 'https://www.udemy.com/courses/search/?q=marketing+digital',
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
    url: 'https://www.udemy.com/courses/search/?q=english+interview',
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
    url: 'https://www.udemy.com/courses/search/?q=logistica+supply+chain',
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
    url: 'https://www.udemy.com/courses/search/?q=vendas+negociacao',
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
    url: 'https://www.udemy.com/courses/search/?q=design+grafico',
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
    url: 'https://www.udemy.com/courses/search/?q=gestao+de+projetos+scrum',
  },
];