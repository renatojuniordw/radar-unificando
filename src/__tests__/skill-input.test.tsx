// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

beforeEach(() => {
  PROPS.onAddSkill.mockClear();
  PROPS.onAddSkills.mockClear();
  PROPS.onRemoveSkill.mockClear();
});

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

  it('should_add_batch_with_newline_separator_on_paste', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.paste(input, { clipboardData: { getData: () => 'GraphQL\nRust' } });
    expect(PROPS.onAddSkills).toHaveBeenCalledWith(['GraphQL', 'Rust']);
  });

  it('should_add_batch_on_semicolon_key', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'GraphQL;Rust' } });
    fireEvent.keyDown(input, { key: ';' });
    expect(PROPS.onAddSkills).toHaveBeenCalledWith(['GraphQL', 'Rust']);
  });

  it('should_commit_input_on_tab_key', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'GraphQL' } });
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('GraphQL');
  });

  it('should_add_batch_on_enter_with_comma_separated_input', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'GraphQL, Rust' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkills).toHaveBeenCalledWith(['GraphQL', 'Rust']);
  });

  it('should_trim_spaces_around_comma_separated_skills', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'GraphQL ,  Rust , Go' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(PROPS.onAddSkills).toHaveBeenCalledWith(['GraphQL', 'Rust', 'Go']);
  });

  it('should_not_commit_whitespace_only_input_when_dropdown_closed', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkill).not.toHaveBeenCalled();
    expect(PROPS.onAddSkills).not.toHaveBeenCalled();
  });

  it('should_commit_selected_suggestion_when_enter_with_whitespace_input', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkill).toHaveBeenCalled();
  });

  it('should_not_remove_skill_on_backspace_with_input_value', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'React' } });
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(PROPS.onRemoveSkill).not.toHaveBeenCalled();
  });

  it('should_navigate_down_and_select_second_suggestion', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('AWS');
  });

  it('should_navigate_up_and_wrap_to_last_suggestion', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('AWS');
  });

  it('should_wrap_arrow_down_back_to_first_suggestion', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('React');
  });

  it('should_focus_input_without_suggestions_ignore_arrows', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'zzz' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('value')).toBe('zzz');
  });

  it('should_reopen_dropdown_on_input_focus', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Re' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByText('↵ Adicionar')).toBeNull();
    fireEvent.focus(input);
    expect(screen.getAllByText('↵ Adicionar').length).toBeGreaterThan(0);
  });

  it('should_focus_input_when_clicking_inner_container', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    const clickable = screen.getByTestId('profile-skill-input').firstElementChild as HTMLElement;
    fireEvent.click(clickable);
    expect(document.activeElement).toBe(input);
  });

  it('should_select_suggestion_on_mouse_enter_then_enter', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    const options = screen.getAllByTestId('profile-skill-suggestion-option');
    fireEvent.mouseEnter(options[1]);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('AWS');
  });

  it('should_not_show_dropdown_for_already_selected_skill', () => {
    renderSkillInput({ skills: ['React'] });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Re' } });
    expect(screen.queryByText('↵ Adicionar')).toBeNull();
  });

  it('should_commit_typed_text_when_no_suggestion_matches', () => {
    renderSkillInput({ skills: ['React'] });
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Re' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(PROPS.onAddSkill).toHaveBeenCalledWith('Re');
  });

  it('should_clear_input_after_commit', () => {
    renderSkillInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'GraphQL' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.getAttribute('value')).toBe('');
  });

  it('should_not_show_quick_suggestions_when_area_skills_empty', () => {
    renderSkillInput({ areaSkills: [] });
    expect(screen.queryByText('Sugestões Rápidas:')).toBeNull();
  });

  it('should_limit_quick_suggestions_to_ten', () => {
    renderSkillInput({
      areaSkills: Array.from({ length: 12 }, (_, i) => `Skill ${i + 1}`),
    });
    expect(screen.getAllByTestId('profile-skill-suggestion-button')).toHaveLength(10);
  });

  it('should_handle_quick_suggestion_hover_events', () => {
    renderSkillInput();
    const button = screen.getByText('+ SQL');
    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    expect(button).toBeTruthy();
  });
});