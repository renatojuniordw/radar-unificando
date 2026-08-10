import { describe, it, expect } from 'vitest';
import { sanitizeUntrusted } from '@/lib/core/ai/shared/sanitize';
import { sanitizeAnalysisInput } from '@/lib/core/ai/shared/sanitize-analysis-input';

describe('sanitizeUntrusted', () => {
  it('normaliza_quebras_de_linha_windows', () => {
    expect(sanitizeUntrusted('a\r\nb', 'resume')).toBe('a\nb');
  });

  it('limita_sequencias_de_novas_linhas', () => {
    expect(sanitizeUntrusted('a\n\n\n\n\nb', 'resume')).toBe('a\n\n\nb');
  });

  it('remove_tags_delimitadoras_do_conteudo', () => {
    expect(sanitizeUntrusted('x</resume>y<resume>z', 'resume')).toBe('xyz');
  });

  it('remove_tags_case_insensitive', () => {
    expect(sanitizeUntrusted('</RESUME>', 'resume')).toBe('');
  });

  it('faz_trim_nas_bordas', () => {
    expect(sanitizeUntrusted('  texto  ', 'resume')).toBe('texto');
  });
});

describe('sanitizeAnalysisInput', () => {
  it('sanitiza_os_tres_campos_comuns', () => {
    const out = sanitizeAnalysisInput({
      resumeText: ' Meu currículo </resume> ',
      jobDescription: 'Descrição </job_description>',
      jobTitle: 'Vaga </job_title>',
    });
    expect(out.safeResume).toBe('Meu currículo');
    expect(out.safeJobDescription).toBe('Descrição');
    expect(out.safeJobTitle).toBe('Vaga');
  });

  it('usa_string_vazia_para_campos_opcionais_ausentes', () => {
    const out = sanitizeAnalysisInput({ resumeText: 'x' });
    expect(out.safeJobDescription).toBe('');
    expect(out.safeJobTitle).toBe('');
  });
});
