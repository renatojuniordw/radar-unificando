// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagInput } from '@/components/ui/tag-input';

const onChange = vi.fn();

function renderTagInput(overrides: Partial<Parameters<typeof TagInput>[0]> = {}) {
  return render(
    <TagInput
      placeholder="Digite termos"
      value={['Python']}
      onChange={onChange}
      label="Skills"
      {...overrides}
    />,
  );
}

describe('TagInput', () => {
  it('should_render_chips_and_input', () => {
    renderTagInput();
    expect(screen.getByText('Python')).toBeTruthy();
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('should_add_batch_on_enter', () => {
    renderTagInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'SQL' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Python', 'SQL']);
  });

  it('should_add_batch_on_comma', () => {
    renderTagInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'SQL, Rust' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onChange).toHaveBeenCalledWith(['Python', 'SQL', 'Rust']);
  });

  it('should_deduplicate_existing_tags', () => {
    renderTagInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Python, SQL' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['Python', 'SQL']);
  });

  it('should_remove_last_chip_on_backspace_with_empty_input', () => {
    renderTagInput();
    fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should_commit_pasted_text', () => {
    renderTagInput();
    fireEvent.paste(screen.getByRole('textbox'), { clipboardData: { getData: () => 'SQL, Rust' } });
    expect(onChange).toHaveBeenCalledWith(['Python', 'SQL', 'Rust']);
  });

  it('should_commit_on_blur', () => {
    renderTagInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'SQL' } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(['Python', 'SQL']);
  });

  it('should_remove_chip_via_delete_icon', () => {
    const { container } = renderTagInput();
    const deleteIcon = container.querySelector('.MuiChip-deleteIcon') as HTMLElement;
    expect(deleteIcon).toBeTruthy();
    fireEvent.click(deleteIcon);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('should_show_dynamic_hint_while_typing', () => {
    renderTagInput();
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'SQL' } });
    expect(screen.getByText(/Pressione vírgula/)).toBeTruthy();
  });

  it('should_show_count_hint_when_tags_exist', () => {
    renderTagInput();
    expect(screen.getByText(/1 termo\(s\) em chips/)).toBeTruthy();
  });

  it('should_hide_helper_hint_when_disabled', () => {
    renderTagInput({ showHelperHint: false });
    expect(screen.queryByText(/termo\(s\) em chips/)).toBeNull();
  });
});