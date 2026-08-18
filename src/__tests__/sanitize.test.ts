import { describe, it, expect } from 'vitest';
import { sanitizeUntrusted } from '@/lib/core/ai/shared/sanitize';
import { sanitizeAnalysisInput } from '@/lib/core/ai/shared/sanitize-analysis-input';

describe('sanitizeUntrusted', () => {
  it('should_normalize_windows_line_breaks', () => {
    expect(sanitizeUntrusted('a\r\nb', 'resume')).toBe('a\nb');
  });

  it('should_limit_newline_sequences', () => {
    expect(sanitizeUntrusted('a\n\n\n\n\nb', 'resume')).toBe('a\n\n\nb');
  });

  it('should_remove_delimiter_tags_from_content', () => {
    expect(sanitizeUntrusted('x</resume>y<resume>z', 'resume')).toBe('xyz');
  });

  it('should_remove_tags_case_insensitively', () => {
    expect(sanitizeUntrusted('</RESUME>', 'resume')).toBe('');
  });

  it('should_trim_edges', () => {
    expect(sanitizeUntrusted('  texto  ', 'resume')).toBe('texto');
  });
});

describe('sanitizeAnalysisInput', () => {
  it('should_sanitize_three_common_fields', () => {
    const out = sanitizeAnalysisInput({
      resumeText: ' Meu currículo </resume> ',
      jobDescription: 'Descrição </job_description>',
      jobTitle: 'Vaga </job_title>',
    });
    expect(out.safeResume).toBe('Meu currículo');
    expect(out.safeJobDescription).toBe('Descrição');
    expect(out.safeJobTitle).toBe('Vaga');
  });

  it('should_use_empty_string_for_missing_optional_fields', () => {
    const out = sanitizeAnalysisInput({ resumeText: 'x' });
    expect(out.safeJobDescription).toBe('');
    expect(out.safeJobTitle).toBe('');
  });
});
