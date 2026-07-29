import { TextUtils } from './text-utils';

const STOP = new Set([
  'sa', 's', 'a', 'ltda', 'me', 'eireli', 'group', 'grupo', 'the', 'company',
  'co', 'tecnologia', 'tech', 'brasil', 'brazil', 'do', 'de', 'da', 'dos',
  'das', 'and', 'solutions', 'software', 'digital', 'inc', 'holding',
  'participacoes', 'banco',
]);

const GENERIC = new Set([
  ...STOP,
  'consultoria', 'consulting', 'saude', 'educacao', 'educacional', 'educacent',
  'servicos', 'servico', 'sistemas', 'seguros', 'seguro', 'energia', 'capital',
  'ventures', 'labs', 'lab', 'data', 'dados', 'tech', 'technology', 'digital',
  'solutions', 'solucoes', 'engenharia', 'industria', 'industrial', 'comercio',
  'comercial', 'agro', 'pay', 'app', 'software', 'cloud', 'global', 'partners',
  'advogados', 'advocacia', 'corporate', 'gov', 'store', 'saudavel', 'nutricao',
  'alimentos', 'recruitment', 'rh', 'consult', 'it',
]);

export class CompanyMatcher {
  constructor(private readonly textUtils: TextUtils) {}

  getStopWords(): Set<string> {
    return STOP;
  }

  getGenericWords(): Set<string> {
    return GENERIC;
  }

  meaningfulTokens(s: string): string[] {
    const toks = this.textUtils.tokens(s);
    return toks.filter(t => !GENERIC.has(t));
  }

  matches(companyName: string, tenantName: string): boolean {
    const ca = this.textUtils.compact(companyName);
    const cb = this.textUtils.compact(tenantName);
    if (!ca || !cb) return false;
    if (ca === cb) return true;

    if (ca.length >= 5 && cb.includes(ca)) return true;
    if (cb.length >= 5 && ca.includes(cb)) return true;

    const a = new Set(this.meaningfulTokens(companyName));
    const b = new Set(this.meaningfulTokens(tenantName));
    for (const t of a) {
      if (b.has(t) && t.length >= 3) return true;
    }

    return false;
  }

  alerta(jobTitle: string, location: string): string {
    const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const t = norm(jobTitle);
    const notes: string[] = [];

    if (/hibrid|presencial|on-?site/.test(t)) {
      notes.push('título menciona híbrido/presencial — conferir');
    }

    const loc = norm(location);
    const brOk = loc === '' || /\bbr\b|brasil|brazil/.test(loc);
    const foreign = /\b(us|usa|eua|singapore|sg|portugal|pt|mexico|argentina|spain|espanha|uk|remote latam|north america)\b/.test(loc);

    if (!brOk && foreign) {
      notes.push('local fora do BR — pode exigir inglês');
    }

    return notes.join('; ');
  }
}
