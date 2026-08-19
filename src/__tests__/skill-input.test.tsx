// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillInput } from '@/components/profile/skill-input';

const PROPS = {
  skills: ['Python'],
  allSuggestions: ['Python', 'SQL', 'React', 'TypeScript', 'AWS', 'Docker', 'Kubernetes', 'Excel', 'Power BI'],
  areaSkills: ['SQL', 'Excel'],
  onAddSkill: vi.fn(),
  onAddSkills: vi.fn(),
  onRemoveSkill: vi.fn(),
};

function renderSkillInput(overrides: Partial<typeof PROPS> = {}) {
  const props = { ...PROPS, ...overrides };
  return render(<SkillInput {...props} />);
}

describe('SkillInput', () => {
  it('should_render_existing_skills_as_tags', () => {
    renderSkillInput();
    expect(screen.getByText('Python')).toBeTruthy();
    expect(screen.getByTitle('Remover skill')).toBeTruthy();
  });

  it('should_show_placeholder_for_empty_skills', () => {
    renderSkillInput({ skills: [] });
    expect(screen.getByPlaceholderText(/Digite skills/)).toBeTruthy();
  });

  it('should_show_add_more_placeholder_when_skills_exist', () => {
    renderSkillInput();
    expect(screen.getByPlaceholderText(/Adicionar mais skills/)).toBeTruthy();
  });

  it('should_add_single_skill_on_enter', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'GraphQL' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('GraphQL');
    expect(PROPS.onAddSkills).not.toHaveBeenCalled();
  });

  it('should_add_batch_of_skills_on_comma_separated_input', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'GraphQL, Rust' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(PROPS.onAddSkills).toHaveBeenCalledWith(['GraphQL', 'Rust']);
  });

  it('should_commit_selected_suggestion_on_enter', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Re' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('React');
  });

  it('should_navigate_suggestions_with_arrow_keys', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Re' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    // 'Re' filtra para ['React'] — ArrowDown navega para o segundo se houver
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('React');
  });

  it('should_close_dropdown_on_escape', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'S' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('↵ Adicionar')).toBeNull();
  });

  it('should_remove_last_skill_on_backspace_with_empty_input', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(PROPS.onRemoveSkill).toHaveBeenCalledWith('Python');
  });

  it('should_commit_pasted_text', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.paste(input, { clipboardData: { getData: () => 'GraphQL, Rust' } });
    expect(PROPS.onAddSkills).toHaveBeenCalledWith(['GraphQL', 'Rust']);
  });

  it('should_add_skill_when_clicking_suggestion', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'SQL' } });
    fireEvent.click(screen.getByText('SQL'));
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('SQL');
  });

  it('should_remove_skill_when_clicking_remove_button', () => {
    renderSkillInput();
    fireEvent.click(screen.getByTitle('Remover skill'));
    expect(PROPS.onRemoveSkill).toHaveBeenCalledWith('Python');
  });

  it('should_render_and_add_quick_suggestions', () => {
    renderSkillInput();
    expect(screen.getByText('Sugestões Rápidas:')).toBeTruthy();
    fireEvent.click(screen.getByText('+ SQL'));
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('SQL');
  });

  it('should_not_show_quick_suggestions_already_selected', () => {
    renderSkillInput({ skills: ['Python', 'SQL'] });
    expect(screen.queryByText('+ SQL')).toBeNull();
  });

  it('should_close_dropdown_when_clicking_outside', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Re' } });
    expect(screen.getAllByText('↵ Adicionar').length).toBeGreaterThan(0);
    fireEvent.mouseDown(document.body);
    expect(screen.queryAllByText('↵ Adicionar').length).toBe(0);
  });
});