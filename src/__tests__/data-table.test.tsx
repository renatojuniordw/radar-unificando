// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopDataTable } from '@/components/admin/data-table';

const DATA = Array.from({ length: 12 }, (_, i) => ({ name: `Termo ${i + 1}`, count: 100 - i }));

describe('TopDataTable', () => {
  it('should_render_title_and_total', () => {
    render(<TopDataTable title="Top Termos" data={DATA} />);
    expect(screen.getByText('Top Termos')).toBeTruthy();
    expect(screen.getByText('Total: 12')).toBeTruthy();
  });

  it('should_render_first_page_rows', () => {
    render(<TopDataTable title="Top" data={DATA} />);
    expect(screen.getByText('Termo 1')).toBeTruthy();
    expect(screen.getByText('Termo 5')).toBeTruthy();
    expect(screen.queryByText('Termo 6')).toBeNull();
  });

  it('should_filter_rows_by_search', () => {
    render(<TopDataTable title="Top" data={DATA} />);
    fireEvent.change(screen.getByPlaceholderText('Buscar nesta tabela...'), { target: { value: 'Termo 3' } });
    expect(screen.getByText('Termo 3')).toBeTruthy();
    expect(screen.queryByText('Termo 1')).toBeNull();
  });

  it('should_show_no_results_message_when_filter_matches_nothing', () => {
    render(<TopDataTable title="Top" data={DATA} />);
    fireEvent.change(screen.getByPlaceholderText('Buscar nesta tabela...'), { target: { value: 'zzz' } });
    expect(screen.getByText('Nenhum resultado encontrado para o filtro')).toBeTruthy();
  });

  it('should_show_empty_message_when_no_data', () => {
    render(<TopDataTable title="Top" data={[]} />);
    expect(screen.getByText('Sem dados no período')).toBeTruthy();
  });

  it('should_navigate_pages_with_next_and_previous', () => {
    render(<TopDataTable title="Top" data={DATA} />);
    fireEvent.click(screen.getByLabelText('Próxima página'));
    expect(screen.getByText('Termo 6')).toBeTruthy();
    expect(screen.queryByText('Termo 1')).toBeNull();
    fireEvent.click(screen.getByLabelText('Página anterior'));
    expect(screen.getByText('Termo 1')).toBeTruthy();
  });

  it('should_disable_previous_on_first_page_and_next_on_last', () => {
    render(<TopDataTable title="Top" data={DATA} />);
    expect((screen.getByLabelText('Página anterior') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Próxima página'));
    fireEvent.click(screen.getByLabelText('Próxima página'));
    expect((screen.getByLabelText('Próxima página') as HTMLButtonElement).disabled).toBe(true);
  });

  it('should_change_page_size', () => {
    render(<TopDataTable title="Top" data={DATA} />);
    fireEvent.click(screen.getByLabelText('Exibir 20 itens por página'));
    expect(screen.getByText('Termo 12')).toBeTruthy();
  });

  it('should_display_formatted_counts', () => {
    render(<TopDataTable title="Top" data={[{ name: 'Python', count: 1234 }]} />);
    expect(screen.getByText('1.234')).toBeTruthy();
  });
});