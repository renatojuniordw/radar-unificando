// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { JobFiltersDesktop } from '@/components/job-table/job-filters-desktop';

type Props = {
  platformFilter: string;
  companyFilter: string;
  typeFilter: string;
  roleFilter: string;
  searchFilter: string;
  countSecondaryFilters: number;
  countTotalFilters: number;
  companies: string[];
  types: string[];
  roles: string[];
};

function renderDesktop(overrides: Partial<Props> = {}) {
  const handlers = {
    onPlatformChange: vi.fn(),
    onCompanyChange: vi.fn(),
    onTypeChange: vi.fn(),
    onRoleChange: vi.fn(),
    onSearchChange: vi.fn(),
    onSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    onOpenDrawer: vi.fn(),
    onClearFilters: vi.fn(),
  };

  const props: Props = {
    platformFilter: '',
    companyFilter: '',
    typeFilter: '',
    roleFilter: '',
    searchFilter: '',
    countSecondaryFilters: 0,
    countTotalFilters: 0,
    companies: ['Acme', 'Initech'],
    types: ['Remota', 'Híbrida', 'Presencial'],
    roles: ['Dev', 'QA'],
    ...overrides,
  };

  const utils = render(
    <JobFiltersDesktop
      platformFilter={props.platformFilter}
      onPlatformChange={handlers.onPlatformChange}
      companies={props.companies}
      companyFilter={props.companyFilter}
      onCompanyChange={handlers.onCompanyChange}
      types={props.types}
      typeFilter={props.typeFilter}
      onTypeChange={handlers.onTypeChange}
      roles={props.roles}
      roleFilter={props.roleFilter}
      onRoleChange={handlers.onRoleChange}
      searchFilter={props.searchFilter}
      onSearchChange={handlers.onSearchChange}
      onSubmit={handlers.onSubmit}
      countSecondaryFilters={props.countSecondaryFilters}
      countTotalFilters={props.countTotalFilters}
      onOpenDrawer={handlers.onOpenDrawer}
      onClearFilters={handlers.onClearFilters}
    />,
  );

  return { ...utils, ...handlers };
}

function clickChip(label: string) {
  fireEvent.click(screen.getByText(label));
}

function clickChipInGroup(groupLabel: string, chipLabel: string) {
  const group = screen.getByText(groupLabel).closest('div')!.parentElement!;
  fireEvent.click(within(group).getByText(chipLabel));
}

function clickChipDelete(label: string) {
  const chip = screen.getByText(label).closest('.MuiChip-root');
  const deleteIcon = chip!.querySelector('.MuiChip-deleteIcon');
  fireEvent.click(deleteIcon!);
}

describe('JobFiltersDesktop', () => {
  it('should_call_on_search_change_when_search_input_changes', () => {
    const { onSearchChange } = renderDesktop();
    fireEvent.change(screen.getByPlaceholderText('Refinar resultados nesta lista por palavra-chave...'), {
      target: { value: 'react' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('react');
  });

  it('should_submit_form_when_buscar_clicked', () => {
    const { onSubmit } = renderDesktop();
    fireEvent.click(screen.getByRole('button', { name: 'BUSCAR' }));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should_open_drawer_when_advanced_filters_clicked', () => {
    const { onOpenDrawer } = renderDesktop();
    fireEvent.click(screen.getByRole('button', { name: /FILTROS AVANÇADOS/ }));
    expect(onOpenDrawer).toHaveBeenCalled();
  });

  it('should_select_platform_chip', () => {
    const { onPlatformChange } = renderDesktop();
    clickChip('GUPY');
    expect(onPlatformChange).toHaveBeenCalledWith('Gupy');
  });

  it('should_select_all_platforms_chip', () => {
    const { onPlatformChange } = renderDesktop();
    clickChipInGroup('Plataforma', 'TODAS');
    expect(onPlatformChange).toHaveBeenCalledWith('');
  });

  it('should_select_inhire_platform_chip', () => {
    const { onPlatformChange } = renderDesktop();
    clickChip('INHIRE');
    expect(onPlatformChange).toHaveBeenCalledWith('InHire');
  });

  it('should_select_modality_chips', () => {
    const { onTypeChange } = renderDesktop();
    clickChip('HÍBRIDO');
    expect(onTypeChange).toHaveBeenCalledWith('Híbrida');
    clickChip('REMOTO');
    expect(onTypeChange).toHaveBeenCalledWith('Remota');
    clickChip('PRESENCIAL');
    expect(onTypeChange).toHaveBeenCalledWith('Presencial');
  });

  it('should_select_all_modalities_chip', () => {
    const { onTypeChange } = renderDesktop();
    clickChipInGroup('Modalidade', 'TODAS');
    expect(onTypeChange).toHaveBeenCalledWith('');
  });

  it('should_render_active_filter_chips_when_filters_are_active', () => {
    renderDesktop({
      platformFilter: 'Gupy',
      companyFilter: 'Acme',
      typeFilter: 'Remota',
      roleFilter: 'Dev',
      countTotalFilters: 4,
    });
    expect(screen.getByText('Filtros Ativos:')).toBeTruthy();
    expect(screen.getByText('Plataforma: Gupy')).toBeTruthy();
    expect(screen.getByText('Empresa: Acme')).toBeTruthy();
    expect(screen.getByText('Modalidade: Remota')).toBeTruthy();
    expect(screen.getByText('Cargo: Dev')).toBeTruthy();
  });

  it('should_not_render_active_filter_bar_when_no_filters', () => {
    renderDesktop();
    expect(screen.queryByText('Filtros Ativos:')).toBeNull();
  });

  it('should_remove_platform_filter_via_chip_delete', () => {
    const { onPlatformChange } = renderDesktop({ platformFilter: 'Gupy', countTotalFilters: 1 });
    clickChipDelete('Plataforma: Gupy');
    expect(onPlatformChange).toHaveBeenCalledWith('');
  });

  it('should_remove_company_filter_via_chip_delete', () => {
    const { onCompanyChange } = renderDesktop({ companyFilter: 'Acme', countTotalFilters: 1 });
    clickChipDelete('Empresa: Acme');
    expect(onCompanyChange).toHaveBeenCalledWith('');
  });

  it('should_remove_type_filter_via_chip_delete', () => {
    const { onTypeChange } = renderDesktop({ typeFilter: 'Remota', countTotalFilters: 1 });
    clickChipDelete('Modalidade: Remota');
    expect(onTypeChange).toHaveBeenCalledWith('');
  });

  it('should_remove_role_filter_via_chip_delete', () => {
    const { onRoleChange } = renderDesktop({ roleFilter: 'Dev', countTotalFilters: 1 });
    clickChipDelete('Cargo: Dev');
    expect(onRoleChange).toHaveBeenCalledWith('');
  });

  it('should_show_badge_with_secondary_filter_count', () => {
    renderDesktop({ countSecondaryFilters: 2 });
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('should_clear_all_filters_when_limpar_todos_clicked', () => {
    const { onClearFilters } = renderDesktop({ countTotalFilters: 2 });
    fireEvent.click(screen.getByRole('button', { name: 'Limpar todos' }));
    expect(onClearFilters).toHaveBeenCalled();
  });
});
