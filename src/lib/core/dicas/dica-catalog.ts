// Catálogo de tutoriais e dicas de carreira.
// Módulo puro e testável — sem dependência de DB ou LLM.

export type DicaCategory = 'curriculo' | 'ferramenta' | 'carreira' | 'ats';

export interface DicaSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface DicaFaqItem {
  question: string;
  answer: string;
}

export interface Dica {
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  category: DicaCategory;
  secondCategory?: DicaCategory;
  publishDate: string;
  updateDate?: string;
  sections: DicaSection[];
  faq: DicaFaqItem[];
  estimatedReadingMinutes: number;
}

export const DICA_CATEGORIES: Record<
  DicaCategory,
  { label: string; description: string }
> = {
  curriculo: {
    label: 'Currículo',
    description: 'Dicas para escrever um currículo eficaz',
  },
  ferramenta: {
    label: 'Ferramentas',
    description: 'Tutoriais das ferramentas do Radar Unificando',
  },
  carreira: {
    label: 'Carreira',
    description: 'Conselhos para sua trajetória profissional',
  },
  ats: {
    label: 'ATS',
    description: 'Como passar nos filtros automáticos',
  },
};

export const DICA_CATALOG: Dica[] = [
  {
    slug: 'como-otimizar-curriculo-para-ats',
    title: 'Como Otimizar seu Currículo para ATS',
    shortTitle: 'Otimizar Currículo para ATS',
    description:
      'Aprenda a formatar seu currículo para passar nos filtros automáticos (ATS) com boas práticas de estrutura, palavras-chave e resultados mensuráveis.',
    category: 'curriculo',
    secondCategory: 'ats',
    publishDate: '2026-08-20',
    estimatedReadingMinutes: 6,
    sections: [
      {
        heading: 'O que é ATS',
        paragraphs: [
          'ATS (Applicant Tracking System) é o software que empresas usam para receber, organizar e filtrar currículos automaticamente. A maioria dos processos seletivos — inclusive nas maiores empresas do Brasil — usa algum tipo de filtro automático.',
          'O sistema lê o documento, extrai dados como nome, e-mail, experiência e habilidades, e compara com as palavras-chave da vaga. Se o seu currículo não estiver no formato certo ou não tiver as keywords esperadas, ele pode ser descartado silenciosamente — antes de um humano ver.',
        ],
      },
      {
        heading: 'Erros comuns que eliminam seu currículo',
        list: [
          'Formatação ilegível: colunas, tabelas, imagens e fontes decorativas quebram o parser do ATS.',
          'Sem seções padrão: Experiência, Formação e Habilidades precisam estar claramente identificadas.',
          'Sem dados de contato: e-mail e telefone são obrigatórios para o recrutador.',
          'Ausência de palavras-chave: skills e ferramentas mencionadas na vaga precisam aparecer no texto.',
          'Sem resultados mensuráveis: "aumentei vendas" vale menos que "aumentei vendas em 30% em 6 meses".',
        ],
      },
      {
        heading: 'Estrutura ideal do currículo',
        paragraphs: [
          'Use um formato limpo e previsível. O ATS precisa identificar facilmente cada seção do documento.',
        ],
        list: [
          'Dados de contato (nome, e-mail, telefone, cidade, LinkedIn).',
          'Resumo profissional (2-3 linhas com keywords da área).',
          'Experiência profissional (cargo, empresa, período, bullets com resultados).',
          'Formação acadêmica (curso, instituição, ano).',
          'Habilidades e competências (lista de keywords relevantes).',
          'Certificações e cursos complementares (se houver).',
        ],
      },
      {
        heading: 'Palavras-chave e keywords',
        paragraphs: [
          'Leia a descrição da vaga e identifique as palavras-chave mais repetidas — são exatamente as que o ATS busca no seu currículo. Inclua-as de forma natural nos bullets de experiência e na seção de habilidades.',
          'Não invente skills que você não tem. O objetivo é retratar fielmente suas competências usando o vocabulário da vaga.',
        ],
      },
      {
        heading: 'Resultados mensuráveis',
        paragraphs: [
          'Números tornam sua experiência concreta e verificável. Em vez de descrever tarefas, descreva impactos.',
        ],
        list: [
          '"Liderei equipe de 5 pessoas" → "Liderei equipe de 5 devs, reduzindo lead time em 40%".',
          '"Gerenciei projetos" → "Gerenciei 12 projetos simultâneos com orçamento de R$ 500k".',
          '"Aumentei vendas" → "Aumentei receita em 25% no trimestre, batendo meta pela 3ª vez consecutiva".',
        ],
      },
      {
        heading: 'Checklist final',
        list: [
          'Formato de texto simples (sem tabelas, colunas ou imagens).',
          'Seções claramente identificadas (Experiência, Formação, Habilidades).',
          'Dados de contato completos (nome, e-mail, telefone, LinkedIn).',
          'Palavras-chave da vaga incluídas naturalmente.',
          'Resultados com números em pelo menos 3 bullets.',
          '1 a 2 páginas de extensão.',
          'Arquivo em PDF ou DOCX (nunca imagem).',
          'Revisado para erros de português.',
        ],
      },
    ],
    faq: [
      {
        question: 'O que é ATS e por que afeta meu currículo?',
        answer:
          'ATS é o sistema que empresas usam para filtrar currículos automaticamente. Ele lê o documento e busca palavras-chave da vaga. Se o seu currículo não tiver as keywords certas ou estiver mal formatado, pode ser descartado antes de um humano ver.',
      },
      {
        question: 'Qual o maior erro que as pessoas cometem no currículo?',
        answer:
          'Enviar o mesmo currículo genérico para todas as vagas. Cada vaga pede keywords específicas — adaptar o currículo para cada oportunidade aumenta drasticamente suas chances de passar no filtro.',
      },
      {
        question: 'Como o Radar Unificando ajuda com ATS?',
        answer:
          'O Radar Unificando analisa seu currículo e gera um score ATS de 0 a 100, identificando exatamente quais palavras-chave estão faltando e quais seções precisam de ajuste. Você também pode gerar um currículo adaptado para cada vaga.',
      },
    ],
  },
  {
    slug: 'como-usar-o-radar-unificando',
    title: 'Como Usar o Radar Unificando',
    shortTitle: 'Guia do Radar Unificando',
    description:
      'Guia completo para usar o Radar Unificando: busque vagas, analise seu currículo, receba recomendações de cursos e use o assistente de IA.',
    category: 'ferramenta',
    publishDate: '2026-08-20',
    estimatedReadingMinutes: 5,
    sections: [
      {
        heading: 'Criar conta e configurar perfil',
        paragraphs: [
          'Acesse radar.unificando.com.br e crie sua conta gratuita. Na primeira visita, importe seu currículo (PDF do LinkedIn ou texto colado) para que a IA extraia suas habilidades, experiência e senioridade automaticamente.',
          'O perfil completo desbloqueia todas as funcionalidades: análise ATS, recomendação de vagas e cursos personalizados.',
        ],
      },
      {
        heading: 'Buscar vagas por área e empresa',
        paragraphs: [
          'Na página /busca, digite o cargo ou área que você procura. O Radar busca em tempo real no Gupy e InHire — as duas maiores plataformas de recrutamento do Brasil.',
          'Use os filtros por tipo de trabalho (Remoto, Híbrido, Presencial) e empresa para refinar. A busca inteligente expande automaticamente sua query com sinônimos e termos relacionados.',
        ],
      },
      {
        heading: 'Analisar currículo com score ATS',
        paragraphs: [
          'Na página /perfil, clique em "Analisar compatibilidade ATS" para receber um score de 0 a 100 com checklist de boas práticas, palavras-chave faltando e recomendações específicas.',
          'Para uma análise mais precisa, cole a descrição da vaga alvo — o sistema compara seu currículo exatamente com o que a empresa busca.',
        ],
      },
      {
        heading: 'Usar o assistente de IA',
        paragraphs: [
          'O chat com IA pode ajudar a analisar vagas, preparar respostas para entrevistas, escrever cartas de apresentação e recomendar cursos para fechar gaps técnicos.',
          'Basta digitar sua pergunta ou pedir para o assistente analisar uma vaga específica.',
        ],
      },
      {
        heading: 'Exportar e gerenciar resultados',
        paragraphs: [
          'Use o botão de exportação para baixar os resultados da busca em CSV ou JSON. O histórico de currículos gerados fica acessível na aba "Currículos Gerados" do seu perfil.',
        ],
      },
    ],
    faq: [
      {
        question: 'O Radar Unificando é gratuito?',
        answer:
          'Sim. A busca de vagas, análise ATS básica e chat com IA são gratuitos. Funcionalidades avançadas como geração de currículo adaptado têm limites diários para custos de IA.',
      },
      {
        question: 'Com que frequência devo buscar vagas?',
        answer:
          'Recomendamos buscar 1-2 vezes por semana. O sistema filtra vagas com mais de 20 dias para evitar repetição, e o cache de 24h evita buscas desnecessárias.',
      },
      {
        question: 'Meus dados estão seguros?',
        answer:
          'Sim. O Radar Unificando segue a LGPD: seus dados pessoais são anonimizados (PII Redactor) e armazenados com criptografia. O currículo é processado localmente no servidor e não é compartilhado com terceiros.',
      },
    ],
  },
  {
    slug: 'dicas-de-entrevista-para-ti',
    title: 'Dicas de Entrevista para Profissionais de TI',
    shortTitle: 'Entrevistas para Profissionais de TI',
    description:
      'Prepare-se para entrevistas técnicas e comportamentais com dicas práticas para desenvolvedores, analistas de dados e profissionais de TI.',
    category: 'carreira',
    publishDate: '2026-08-20',
    estimatedReadingMinutes: 7,
    sections: [
      {
        heading: 'Preparação antes da entrevista',
        paragraphs: [
          'Pesquise a empresa: entenda o produto, a stack tecnológica, os valores e a cultura. Verifique o LinkedIn dos entrevistadores para entender o perfil da equipe.',
          'Revise a descrição da vaga e mapeie cada requisito com um exemplo concreto da sua experiência. Tenha 3-5 stories prontos que demonstrem suas competências.',
        ],
      },
      {
        heading: 'Entrevista técnica: como se preparar',
        paragraphs: [
          'Para vagas de desenvolvimento: pratique problemas de lógica no LeetCode/HackerRank, revise conceitos da stack pedida, e prepare um projeto pessoal ou repositório no GitHub para mostrar.',
          'Para vagas de dados: domine SQL avançado, estude modelagem de dados e prepare exemplos de dashboards ou relatórios que você criou com impacto mensurável.',
          'Para vagas de infraestrutura/DevOps: revise conceitos de containers, CI/CD, monitoramento e troubleshooting. Tenha exemplos de incidentes que você resolveu.',
        ],
      },
      {
        heading: 'Comportamental: use o método STAR',
        paragraphs: [
          'O método STAR estrutura suas respostas em 4 passos:',
        ],
        list: [
          'Situation: descreva o contexto (projeto, empresa, desafio).',
          'Task: explique sua responsabilidade específica.',
          'Action: detalhe o que você fez (ferramentas, decisões, liderança).',
          'Result: mostre o impacto com números (redução de tempo, aumento de receita, satisfação do cliente).',
        ],
      },
      {
        heading: 'Perguntas que você deve fazer',
        paragraphs: [
          'Sempre tenha perguntas prontas para o final da entrevista. Elas demonstram interesse e maturidade profissional.',
        ],
        list: [
          'Como é o onboarding para novos membros da equipe?',
          'Quais são os maiores desafios técnicos que o time enfrenta hoje?',
          'Como é o processo de code review e deploy?',
          'Quais são as oportunidades de crescimento dentro da empresa?',
        ],
      },
      {
        heading: 'Erros que os candidatos cometem',
        list: [
          'Não pesquisar a empresa antes da entrevista.',
          'Falar apenas de tecnologia sem conectar com impacto no negócio.',
          'Não ter exemplos concretos de resultados (usar apenas "participei").',
          'Chegar atrasado ou sem câmera ligada (em entrevistas remotas).',
          'Não fazer perguntas no final — parece falta de interesse.',
          'Mencionar salário esperado sem ter pesquisado a faixa de mercado.',
        ],
      },
    ],
    faq: [
      {
        question: 'Qual a pergunta mais comum em entrevistas de TI?',
        answer:
          '"Conte sobre um projeto que você liderou e o impacto que teve." Use o método STAR para estruturar: contexto, tarefa, ação e resultado com números.',
      },
      {
        question: 'Como me preparar para entrevista técnica?',
        answer:
          'Pratique problemas de lógica, revise a stack da vaga, e tenha um projeto pessoal ou repositório no GitHub para mostrar. O mais importante é demonstrar pensamento estruturado, não apenas decorar respostas.',
      },
      {
        question: 'Devo negociar salário na primeira entrevista?',
        answer:
          'Não na primeira entrevista. Espere receber uma proposta formal. Antes de negociar, pesquise a faixa de mercado para a vaga e sua senioridade usando fontes como Glassdoor, LinkedIn Salary e Levels.fyi.',
      },
    ],
  },
  {
    slug: 'como-adaptar-curriculo-para-cada-vaga',
    title: 'Como Adaptar seu Currículo para Cada Vaga',
    shortTitle: 'Adaptar Currículo para cada Vaga',
    description:
      'Um currículo genérico não compete. Saiba como customizar seu CV para cada vaga usando palavras-chave, resultados e o Radar Unificando.',
    category: 'curriculo',
    secondCategory: 'ferramenta',
    publishDate: '2026-08-20',
    estimatedReadingMinutes: 5,
    sections: [
      {
        heading: 'Por que adaptar o currículo',
        paragraphs: [
          'Estudos mostram que currículos adaptados para cada vaga têm até 3x mais chance de passar no ATS. Cada empresa usa keywords diferentes, valoriza skills específicas e busca perfis ligeiramente distintos.',
          'Um currículo genérico pode até ser bom — mas ele nunca será o melhor para uma vaga específica. Adaptar é a diferença entre ser "mais um" e ser o candidato ideal.',
        ],
      },
      {
        heading: 'Como identificar as palavras-chave da vaga',
        paragraphs: [
          'Leia a descrição da vaga inteira e sublinhe as palavras que aparecem mais de uma vez. Geralmente são: nome do cargo, skills técnicas, ferramentas e competências comportamentais.',
          'Exemplo: se a vaga repete "React", "TypeScript", "testes" e "API REST", essas são suas keywords obrigatórias no currículo.',
        ],
      },
      {
        heading: 'Ajustes estruturais',
        list: [
          'Reordene os bullets de experiência para destacar o que mais se relaciona com a vaga.',
          'Inclua as keywords da vaga na seção de Habilidades e nos bullets de experiência.',
          'Adapte o resumo profissional para mencionar a área e o tipo de vaga.',
          'Remova experiências irrelevantes que poluem o currículo.',
          'Ajuste o título do currículo para o cargo específico (ex: "Desenvolvedor Full Stack" em vez de "Profissional de TI").',
        ],
      },
      {
        heading: 'Usar a análise ATS para refinamento',
        paragraphs: [
          'O Radar Unificando permite comparar seu currículo com a vaga específica e receber um score ATS com as palavras-chave faltando. Use essa análise como guia para os ajustes.',
          'A funcionalidade de "Currículo Adaptado" gera automaticamente uma versão do seu CV personalizada para a vaga, economizando horas de trabalho manual.',
        ],
      },
      {
        heading: 'Dicas de produtividade',
        list: [
          'Mantenha um "currículo master" com toda sua experiência. Para cada vaga, copie e adapte — não comece do zero.',
          'Crie um template com as seções fixas e apenas ajuste os bullets e keywords.',
          'Use o Radar Unificando para gerar o currículo adaptado automaticamente em PDF ou Word.',
          'Mantenha uma lista das suas principais keywords por área para reutilizar.',
        ],
      },
    ],
    faq: [
      {
        question: 'Quanto devo adaptar o currículo para cada vaga?',
        answer:
          'Mínimo 20-30% do conteúdo. Ajuste os bullets de experiência para incluir keywords da vaga, reordene seções por relevância e adapte o resumo profissional. Não precisa reescrever tudo — ajustes cirúrgicos já fazem diferença.',
      },
      {
        question: 'É necessário adaptar para cada vaga mesmo?',
        answer:
          'Para vagas muito diferentes sim. Para vagas similares na mesma área, uma adaptação leve (keywords + bullets) já resolve. O Radar Unificando automatiza grande parte desse processo.',
      },
      {
        question: 'O Radar Unificando gera o currículo adaptado automaticamente?',
        answer:
          'Sim. Na análise ATS, clique em "Gerar Currículo Adaptado" e o sistema cria uma versão do seu CV personalizada para a vaga, com as keywords corretas e estrutura otimizada. Você pode baixar em PDF ou Word.',
      },
    ],
  },
];

export function allDicaSlugs(): string[] {
  return DICA_CATALOG.map((d) => d.slug);
}

export function dicaFromSlug(slug: string): Dica | undefined {
  return DICA_CATALOG.find((d) => d.slug === slug);
}

export function dicasForCategory(category: DicaCategory): Dica[] {
  return DICA_CATALOG.filter(
    (d) => d.category === category || d.secondCategory === category,
  );
}
