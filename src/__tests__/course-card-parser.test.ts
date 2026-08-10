import { describe, it, expect } from 'vitest';
import { parseJobCards } from '@/components/chat/job-card-parser';

describe('parseJobCards — bloco de curso (📚)', () => {
  it('deve_parsear_bloco_de_curso_documentado', () => {
    const text = [
      'Para cobrir esse gap, recomendo:',
      '',
      '📚 **Formação DevOps** — Alura',
      '📌 Skill: Kubernetes',
      '💰 Assinatura a partir de R$ 99/mês',
      '🔗 https://www.alura.com.br/formacao-devops',
      '',
      'Indicação via link de afiliado — sem custo extra pra você.',
    ].join('\n');

    const segments = parseJobCards(text);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: 'markdown', text: 'Para cobrir esse gap, recomendo:' });
    expect(segments[1]).toEqual({
      type: 'course',
      course: {
        title: 'Formação DevOps',
        provider: 'Alura',
        skill: 'Kubernetes',
        price: 'Assinatura a partir de R$ 99/mês',
        link: 'https://www.alura.com.br/formacao-devops',
      },
    });
    expect(segments[2]).toEqual({
      type: 'markdown',
      text: 'Indicação via link de afiliado — sem custo extra pra você.',
    });
  });

  it('deve_parsear_curso_udemy_sem_provider_no_titulo', () => {
    const text = [
      '📚 **Excel Avançado**',
      '📌 Skill: Excel',
      '💰 R$ 39,90',
      '🔗 https://www.udemy.com/courses/search/?q=excel+avancado',
    ].join('\n');

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'course',
      course: {
        title: 'Excel Avançado',
        skill: 'Excel',
        price: 'R$ 39,90',
        link: 'https://www.udemy.com/courses/search/?q=excel+avancado',
      },
    });
  });

  it('deve_fazer_fallback_para_markdown_quando_faltar_link', () => {
    const text = '📚 **Curso sem link**\n📌 Skill: Python\n💰 R$ 39,90';

    const segments = parseJobCards(text);

    expect(segments).toEqual([{ type: 'markdown', text }]);
  });

  it('deve_intercalar_curso_e_vaga_no_mesmo_texto', () => {
    const text = [
      '📚 **Formação Python** — Alura',
      '📌 Skill: Python',
      '💰 Assinatura',
      '🔗 https://www.alura.com.br/formacao-python',
      '',
      '🏢 **Dev** — Acme',
      '🔗 https://acme.gupy.io/jobs/1',
    ].join('\n');

    const segments = parseJobCards(text);

    expect(segments).toHaveLength(2);
    expect(segments[0].type).toBe('course');
    expect(segments[1].type).toBe('job');
  });

  it('deve_extrair_url_de_link_markdown_no_bloco_de_curso', () => {
    const text = '📚 **Curso** — Udemy\n📌 Skill: Excel\n💰 R$ 39,90\n🔗 [Ver Curso](https://www.udemy.com/course/excel)';

    const segments = parseJobCards(text);

    expect(segments[0]).toEqual({
      type: 'course',
      course: {
        title: 'Curso',
        provider: 'Udemy',
        skill: 'Excel',
        price: 'R$ 39,90',
        link: 'https://www.udemy.com/course/excel',
      },
    });
  });
});