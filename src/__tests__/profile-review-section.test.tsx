// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileReviewSection } from '@/components/profile/profile-review-section';

const onFieldChange = vi.fn();
const onAddSkill = vi.fn();
const onAddSkills = vi.fn();
const onRemoveSkill = vi.fn();

beforeEach(() => {
  onFieldChange.mockReset();
  onAddSkill.mockReset();
  onAddSkills.mockReset();
  onRemoveSkill.mockReset();
});

function renderSection(overrides: Partial<Parameters<typeof ProfileReviewSection>[0]> = {}) {
  return render(
    <ProfileReviewSection
      skills={['Python']}
      currentRole="Analista"
      seniority="pleno"
      area="Dados"
      experienceYears={5}
      education={['Engenharia']}
      onFieldChange={onFieldChange}
      onAddSkill={onAddSkill}
      onAddSkills={onAddSkills}
      onRemoveSkill={onRemoveSkill}
      {...overrides}
    />,
  );
}

describe('ProfileReviewSection', () => {
  it('should_render_skills_count_badge', () => {
    renderSection();
    expect(screen.getByText('SKILLS')).toBeTruthy();
  });

  it('should_change_current_role_field', () => {
    renderSection();
    fireEvent.change(screen.getByLabelText('Cargo Atual'), { target: { value: 'Engenheiro' } });
    expect(onFieldChange).toHaveBeenCalledWith('currentRole', 'Engenheiro');
  });

  it('should_add_category_skills_when_missing', () => {
    renderSection({ skills: ['Python'] });
    fireEvent.click(screen.getByText('+ BI'));
    expect(onAddSkills).toHaveBeenCalledWith(
      expect.arrayContaining(['Power BI']),
    );
  });

  it('should_not_add_when_all_category_skills_present', () => {
    const allDados = ['Python', 'SQL', 'Spark', 'Airflow', 'dbt', 'Databricks', 'Snowflake', 'BigQuery'];
    renderSection({ skills: allDados.map((s) => s.toLowerCase()) });
    fireEvent.click(screen.getByText('+ Dados'));
    expect(onAddSkills).not.toHaveBeenCalled();
  });

  it('should_change_seniority_field', () => {
    renderSection();
    const selects = screen.getAllByRole('combobox');
    fireEvent.mouseDown(selects[0]);
    fireEvent.click(screen.getByText('Senior'));
    expect(onFieldChange).toHaveBeenCalledWith('seniority', 'senior');
  });

  it('should_render_experience_years_label', () => {
    renderSection();
    expect(screen.getByText(/Experiência: 5 anos/)).toBeTruthy();
  });

  it('should_use_singular_ano_for_one_year', () => {
    renderSection({ experienceYears: 1 });
    expect(screen.getByText(/Experiência: 1 ano/)).toBeTruthy();
  });

  it('should_render_education_chips', () => {
    renderSection();
    expect(screen.getByText('Engenharia')).toBeTruthy();
  });

  it('should_not_render_education_section_when_empty', () => {
    renderSection({ education: [] });
    expect(screen.queryByText('Formação')).toBeNull();
  });
});