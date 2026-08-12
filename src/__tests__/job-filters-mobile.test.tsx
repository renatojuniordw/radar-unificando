// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobFiltersMobile } from '@/components/job-table/job-filters-mobile';

type Props = {
  searchFilter: string;
  platformFilter: string;
  typeFilter: string;
  countSecondaryFilters: number;
  countTotalFilters: number;
};

function renderMobile(overrides: Partial<Props> = {}) {
  const handlers = {
    onSearchChange: vi.fn(),
    onPlatformChange: vi.fn(),
    onTypeChange: vi.fn(),
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    onOpenDrawer: vi.fn(),
    onClearFilters: vi.fn(),
  };

  const props: Props = {
    searchFilter: '',
    platformFilter: '',
    typeFilter: '',
    countSecondaryFilters: 0,
    countTotalFilters: 0,
    ...overrides,
  };

  const utils = render(
    <JobFiltersMobile
      searchFilter={props.searchFilter}
      onSearchChange={handlers.onSearchChange}
      platformFilter={props.platformFilter}
      onPlatformChange={handlers.onPlatformChange}
      typeFilter={props.typeFilter}
      onTypeChange={handlers.onTypeChange}
      onSubmit={handlers.onSubmit}
      countSecondaryFilters={props.countSecondaryFilters}
      countTotalFilters={props.countTotalFilters}
      onOpenDrawer={handlers.onOpenDrawer}
      onClearFilters={handlers.onClearFilters}
    />,
  );

  return { ...utils, ...handlers };
}

describe('JobFiltersMobile', () => {
  it('should_call_on_search_change_when_search_input_changes', () => {
    const { onSearchChange } = renderMobile();
    fireEvent.change(screen.getByPlaceholderText('Refinar nesta lista...'), {
      target: { value: 'react' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('react');
  });

  it('should_submit_form_when_ir_clicked', () => {
    const { onSubmit } = renderMobile();
    fireEvent.click(screen.getByRole('button', { name: 'IR' }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should_select_platform_chip_when_not_selected', () => {
    const { onPlatformChange } = renderMobile();
    fireEvent.click(screen.getByText('GUPY'));
    expect(onPlatformChange).toHaveBeenCalledWith('Gupy');
  });

  it('should_deselect_platform_chip_when_already_selected', () => {
    const { onPlatformChange } = renderMobile({ platformFilter: 'Gupy' });
    fireEvent.click(screen.getByText('GUPY'));
    expect(onPlatformChange).toHaveBeenCalledWith('');
  });

  it('should_open_drawer_when_modality_chip_clicked', () => {
    const { onOpenDrawer } = renderMobile();
    fireEvent.click(screen.getByText('MODALIDADE: TODAS'));
    expect(onOpenDrawer).toHaveBeenCalled();
  });

  it('should_show_selected_type_in_modality_chip_label', () => {
    renderMobile({ typeFilter: 'Remota' });
    expect(screen.getByText('MODALIDADE: REMOTA')).toBeTruthy();
  });

  it('should_toggle_type_chip', () => {
    const { onTypeChange } = renderMobile();
    fireEvent.click(screen.getByText('REMOTO'));
    expect(onTypeChange).toHaveBeenCalledWith('Remota');
  });

  it('should_deselect_type_chip_when_already_selected', () => {
    const { onTypeChange } = renderMobile({ typeFilter: 'Remota' });
    fireEvent.click(screen.getByText('REMOTO'));
    expect(onTypeChange).toHaveBeenCalledWith('');
  });

  it('should_open_drawer_when_advanced_filters_clicked', () => {
    const { onOpenDrawer } = renderMobile();
    fireEvent.click(screen.getByRole('button', { name: /FILTROS AVANÇADOS/ }));
    expect(onOpenDrawer).toHaveBeenCalled();
  });

  it('should_show_filter_count_in_advanced_filters_button', () => {
    renderMobile({ countSecondaryFilters: 3 });
    expect(screen.getByText(/FILTROS AVANÇADOS\s*\(3\)/)).toBeTruthy();
  });

  it('should_not_render_limpar_button_when_no_total_filters', () => {
    renderMobile();
    expect(screen.queryByRole('button', { name: 'LIMPAR' })).toBeNull();
  });

  it('should_render_limpar_button_when_total_filters_active_and_clear_on_click', () => {
    const { onClearFilters } = renderMobile({ countTotalFilters: 2 });
    fireEvent.click(screen.getByRole('button', { name: 'LIMPAR' }));
    expect(onClearFilters).toHaveBeenCalled();
  });
});