// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileImportSection } from '@/components/profile/profile-import-section';

const onExtract = vi.fn();
const onDragOver = vi.fn();

beforeEach(() => {
  onExtract.mockReset();
  onDragOver.mockReset();
});

function renderSection(overrides: Partial<Parameters<typeof ProfileImportSection>[0]> = {}) {
  return render(
    <ProfileImportSection
      extracting={false}
      dragOver={false}
      onDragOver={onDragOver}
      onExtract={onExtract}
      {...overrides}
    />,
  );
}

describe('ProfileImportSection', () => {
  it('should_render_title_and_instructions', () => {
    renderSection();
    expect(screen.getByText('IMPORTAR CURRÍCULO')).toBeTruthy();
    expect(screen.getByText(/Faça upload do seu currículo/)).toBeTruthy();
  });

  it('should_show_progress_and_extracting_label_when_extracting', () => {
    renderSection({ extracting: true });
    expect(screen.getByText('EXTRAINDO...')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect((screen.getByText('EXTRAINDO...') as HTMLButtonElement).disabled).toBe(true);
  });

  it('should_change_drop_zone_label_on_drag_over', () => {
    renderSection({ dragOver: true });
    expect(screen.getByText('⚡ Solte o arquivo PDF aqui')).toBeTruthy();
  });

  it('should_extract_file_on_drop', () => {
    renderSection();
    const zone = screen.getByLabelText('Selecionar arquivo PDF do currículo');
    const file = new File(['conteúdo'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(onExtract).toHaveBeenCalledWith(file);
    expect(onDragOver).toHaveBeenCalledWith(false);
  });

  it('should_extract_file_on_input_change', () => {
    const { container } = renderSection();
    const input = container.querySelector('input[type=file]')!;
    const file = new File(['x'], 'cv.pdf', { type: 'application/pdf' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onExtract).toHaveBeenCalledWith(file);
  });

  it('should_trigger_file_picker_on_enter_key', () => {
    const { container } = renderSection();
    const clickSpy = vi.spyOn(container.querySelector('input[type=file]') as HTMLInputElement, 'click').mockImplementation(() => {});
    const zone = screen.getByLabelText('Selecionar arquivo PDF do currículo');
    fireEvent.keyDown(zone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should_extract_text_when_at_least_20_chars', () => {
    renderSection();
    fireEvent.change(screen.getByPlaceholderText('Cole aqui o conteúdo textual do seu currículo...'), {
      target: { value: 'Desenvolvedor com cinco anos de experiência em tecnologia' },
    });
    fireEvent.click(screen.getByText('EXTRAIR DO TEXTO'));
    expect(onExtract).toHaveBeenCalledWith('Desenvolvedor com cinco anos de experiência em tecnologia');
  });

  it('should_not_extract_text_shorter_than_20_chars', () => {
    renderSection();
    fireEvent.change(screen.getByPlaceholderText('Cole aqui o conteúdo textual do seu currículo...'), {
      target: { value: 'curto' },
    });
    fireEvent.click(screen.getByText('EXTRAIR DO TEXTO'));
    expect(onExtract).not.toHaveBeenCalled();
  });
});