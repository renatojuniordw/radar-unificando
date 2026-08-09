import { describe, it, expect } from 'vitest';
import { getDynamicSuggestions } from '@/components/chat/chat-suggested-replies';

describe('Chat Interactive Features', () => {
  it('deve gerar sugestões contextuais para listagem de vagas', () => {
    const textWithJobs = '🏢 Desenvolvedor Front-end React - Empresa X\n📍 Remoto';
    const suggestions = getDynamicSuggestions(textWithJobs);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].label).toContain('Analisar Fit');
    expect(suggestions[1].label).toContain('Gerar Carta');
  });

  it('deve gerar sugestões contextuais para entrevista', () => {
    const textWithInterview = 'Aqui estão as perguntas para o roteiro de entrevista com o recrutador sênior.';
    const suggestions = getDynamicSuggestions(textWithInterview);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions[0].label).toContain('Simular Entrevista');
  });

  it('deve retornar sugestões genéricas quando não houver contexto específico', () => {
    const genericText = 'Olá, como posso te ajudar hoje no Radar Unificando?';
    const suggestions = getDynamicSuggestions(genericText);

    expect(suggestions.length).toBe(3);
    expect(suggestions[0].label).toContain('Analisar Currículo');
  });
});
