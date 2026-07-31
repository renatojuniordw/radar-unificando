// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileAIPreview } from '@/components/profile/profile-ai-preview';

describe('ProfileAIPreview', () => {
  it('should_render_all_fields_with_values', () => {
    render(
      <ProfileAIPreview
        seniority="senior"
        area="Dados"
        skills={['Python', 'SQL', 'Spark']}
        experienceYears={5}
        currentRole="Analista de Dados"
      />
    );
    expect(screen.getByText('senior')).toBeTruthy();
    expect(screen.getByText('Dados')).toBeTruthy();
    expect(screen.getByText('5 anos')).toBeTruthy();
    expect(screen.getByText(/3 skills/)).toBeTruthy();
  });

  it('should_render_placeholders_when_fields_are_empty', () => {
    render(
      <ProfileAIPreview
        seniority=""
        area=""
        skills={[]}
        experienceYears={0}
        currentRole=""
      />
    );
    expect(screen.getAllByText('Não definida').length).toBe(2);
    expect(screen.getByText('Não informada')).toBeTruthy();
    expect(screen.getByText('Nenhuma')).toBeTruthy();
  });

  it('should_show_ready_indicator_when_profile_is_minimal', () => {
    render(
      <ProfileAIPreview
        seniority="pleno"
        area="Dados"
        skills={['Python', 'SQL', 'Spark']}
        experienceYears={3}
        currentRole="Analista de Dados"
      />
    );
    expect(screen.getByText(/Perfil pronto para recomendações/)).toBeTruthy();
  });

  it('should_show_incomplete_warning_when_profile_is_not_minimal', () => {
    render(
      <ProfileAIPreview
        seniority=""
        area=""
        skills={['Python']}
        experienceYears={0}
        currentRole=""
      />
    );
    expect(screen.getByText(/Complete seu perfil para melhores recomendações/)).toBeTruthy();
  });
});
