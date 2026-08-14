import { canonicalQuery } from './normalize';

/**
 * Mapa curado de expansão: cargos comuns → variantes de busca equivalentes
 * (sinônimos PT/EN e nomes alternativos usados pelas empresas no Gupy).
 * Chaves computadas via canonicalQuery no load — evita erro humano de
 * normalização. O service sempre inclui a query original, então ela não
 * precisa estar nas variantes.
 *
 * SEM marcadores de design físico (moda, estamparia, etc.) — o filtro de
 * relevância depende de a busca não conter esses termos para descartar
 * vagas de outra área.
 */
export const QUERY_EXPANSION_MAP: Record<string, string[]> = {
  [canonicalQuery('Analista de Dados')]: ['Analista de Dados', 'Data Analyst', 'Analista de Business Intelligence', 'Analista BI'],
  [canonicalQuery('Analista de Marketing')]: ['Analista de Marketing', 'Marketing Analyst', 'Analista de Mídia', 'Analista de Performance'],
  [canonicalQuery('Assistente Administrativo')]: ['Assistente Administrativo', 'Auxiliar Administrativo', 'Auxiliar de Escritório', 'Office Assistant'],
  [canonicalQuery('Consultor de Vendas')]: ['Consultor de Vendas', 'Sales Consultant', 'Consultor Comercial', 'Representante de Vendas'],
  [canonicalQuery('Analista de RH')]: ['Analista de RH', 'HR Analyst', 'Analista de Recursos Humanos', 'Recrutador', 'Analista de Talentos'],
  [canonicalQuery('Analista Financeiro')]: ['Analista Financeiro', 'Financial Analyst', 'Analista de Finanças', 'Analista Contábil'],
  [canonicalQuery('Analista de Logística')]: ['Analista de Logística', 'Logistics Analyst', 'Analista de Supply Chain', 'Analista de Operações'],
  [canonicalQuery('Customer Success')]: ['Customer Success', 'Analista de Sucesso do Cliente', 'Customer Success Manager', 'Sucesso do Cliente'],
  [canonicalQuery('Designer Gráfico')]: ['Designer Gráfico', 'Graphic Designer', 'Designer Visual'],
  [canonicalQuery('Business Intelligence')]: ['Business Intelligence', 'Analista de Business Intelligence', 'Analista de BI', 'BI Analyst'],
  [canonicalQuery('Coordenador de Projetos')]: ['Coordenador de Projetos', 'Project Coordinator', 'Gerente de Projetos', 'Project Manager'],
  [canonicalQuery('Analista de Qualidade')]: ['Analista de Qualidade', 'Quality Analyst', 'Analista de QA', 'QA Analyst'],
  // Extras comuns fora dos SUGGESTED_ROLES
  [canonicalQuery('Product Designer')]: ['Product Designer', 'Designer de Produto', 'UX Designer', 'UI Designer', 'UX/UI Designer'],
  [canonicalQuery('Desenvolvedor')]: ['Desenvolvedor', 'Developer', 'Software Developer', 'Software Engineer', 'Programador'],
  [canonicalQuery('Product Manager')]: ['Product Manager', 'Gerente de Produto', 'Product Owner', 'Analista de Produto'],
};

/** Retorna as variantes curadas da query, ou null se não houver entrada. */
export function getMapExpansion(query: string): string[] | null {
  return QUERY_EXPANSION_MAP[canonicalQuery(query)] ?? null;
}