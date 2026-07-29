export class RoleMatcher {
  match(title: string): string | null {
    const t = ' ' + title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ') + ' ';
    const has = (re: RegExp) => re.test(t);

    if (has(/ revenue operations /) || has(/ revops /) || has(/ revenue ops /)) return 'Revenue Operations / RevOps';
    if (has(/ growth /)) return 'Growth Analyst / Analista de Growth';
    if (has(/ analista de insights /) || has(/ insights analyst /) || (has(/ insights /) && has(/ analista /))) return 'Analista de Insights';
    if (has(/ inteligencia de mercado /) || has(/ market intelligence /) || (has(/ intelligence /) && has(/ market /))) return 'Analista de Inteligência de Mercado';
    if (has(/ analista de negocios /) || has(/ business analyst /)) return 'Business Analyst / Analista de Negócios';
    if (has(/ inteligencia de negocios /) || has(/ analista de bi /) || has(/ bi analyst /) || has(/ business intelligence /) || has(/ analista de business intelligence /) || has(/ analista bi /)) return 'BI / Business Intelligence';
    if (has(/ analista de dados /) || has(/ data analyst /) || has(/ analista de dados e /)) return 'Analista de Dados / Data Analyst';

    return null;
  }
}
