// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobFiltersDrawer } from '@/components/job-table/job-filters-drawer';

type Props = {
  open: boolean;
  platformFilter: string;
  companyFilter: string;
  typeFilter: string;
  roleFilter: string;
  filteredTotal: number;
  countSecondaryFilters: number;
  companies: string[];
  types: string[];
  roles: string[];
};

function renderDrawer(overrides: Partial<Props> = {}) {
  const handlers = {
    onClose: vi.fn(),
    onPlatformChange: vi.fn(),
    onCompanyChange: vi.fn(),
    onTypeChange: vi.fn(),
    onRoleChange: vi.fn(),
    onClearFilters: vi.fn(),
  };

  const props: Props = {
    open: true,
    platformFilter: '',
    companyFilter: '',
    typeFilter: '',
    roleFilter: '',
    filteredTotal: 12,
    countSecondaryFilters: 0,
    companies: ['Acme', 'Initech'],
    types: ['Remota', 'Híbrida', 'Presencial'],
    roles: ['Dev', 'QA'],
    ...overrides,
  };

  const utils = render(
    <JobFiltersDrawer
      open={props.open}
      onClose={handlers.onClose}
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
      filteredTotal={props.filteredTotal}
      countSecondaryFilters={props.countSecondaryFilters}
      onClearFilters={handlers.onClearFilters}
    />,
  );

  return { ...utils, ...handlers };
}

async function selectAutocomplete(placeholder: string, optionLabel: string) {
  const input = screen.getByPlaceholderText(placeholder);
  fireEvent.mouseDown(input);
  const option = await screen.findByRole('option', { name: optionLabel });
  fireEvent.click(option);
}

describe('JobFiltersDrawer', () => {
  it('should_render_drawer_content_when_open', () => {
    renderDrawer();
    expect(screen.getByText('⚡ FILTROS AVANÇADOS')).toBeTruthy();
  });

  it('should_call_on_close_when_close_icon_clicked', () => {
    const { onClose } = renderDrawer();
    fireEvent.click(screen.getByLabelText('Fechar filtros'));
    expect(onClose).toHaveBeenCalled();
  });

  it('should_call_on_platform_change_when_select_option_clicked', async () => {
    const { onPlatformChange } = renderDrawer();
    const platformSelect = screen.getAllByRole('combobox')[0];
    fireEvent.mouseDown(platformSelect);
    const gupy = await screen.findByRole('option', { name: 'GUPY' });
    fireEvent.click(gupy);
    expect(onPlatformChange).toHaveBeenCalledWith('Gupy');

    fireEvent.mouseDown(platformSelect);
    const inhire = await screen.findByRole('option', { name: 'INHIRE' });
    fireEvent.click(inhire);
    expect(onPlatformChange).toHaveBeenCalledWith('InHire');
  });

  it('should_call_on_company_change_when_autocomplete_option_clicked', async () => {
    const { onCompanyChange } = renderDrawer();
    await selectAutocomplete('SELECIONE UMA EMPRESA', 'Acme');
    expect(onCompanyChange).toHaveBeenCalledWith('Acme');
  });

  it('should_call_on_type_change_when_modality_option_clicked', async () => {
    const { onTypeChange } = renderDrawer();
    await selectAutocomplete('SELECIONE A MODALIDADE', 'Híbrida');
    expect(onTypeChange).toHaveBeenCalledWith('Híbrida');
  });

  it('should_call_on_role_change_when_role_option_clicked', async () => {
    const { onRoleChange } = renderDrawer();
    await selectAutocomplete('SELECIONE O CARGO', 'Dev');
    expect(onRoleChange).toHaveBeenCalledWith('Dev');
  });

  it('should_clear_company_filter_when_autocomplete_is_cleared', async () => {
    const { onCompanyChange } = renderDrawer({ companyFilter: 'Acme' });
    const clearButtons = await screen.findAllByLabelText('Clear');
    fireEvent.click(clearButtons[0]);
    expect(onCompanyChange).toHaveBeenCalledWith('');
  });

  it('should_call_on_close_when_ver_vagas_button_clicked', () => {
    const { onClose } = renderDrawer({ filteredTotal: 12 });
    fireEvent.click(screen.getByRole('button', { name: 'VER 12 VAGAS →' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('should_not_render_limpar_button_when_no_secondary_filters', () => {
    renderDrawer({ countSecondaryFilters: 0 });
    expect(screen.queryByRole('button', { name: 'LIMPAR' })).toBeNull();
  });

  it('should_render_limpar_button_when_secondary_filters_active', () => {
    renderDrawer({ countSecondaryFilters: 2 });
    expect(screen.getByRole('button', { name: 'LIMPAR' })).toBeTruthy();
  });

  it('should_clear_type_and_role_filters_when_autocompletes_are_cleared', async () => {
    const { onTypeChange, onRoleChange } = renderDrawer({ typeFilter: 'Remota', roleFilter: 'Dev' });
    const clearButtons = await screen.findAllByLabelText('Clear');
    fireEvent.click(clearButtons[0]);
    expect(onTypeChange).toHaveBeenCalledWith('');
    fireEvent.click(clearButtons[1]);
    expect(onRoleChange).toHaveBeenCalledWith('');
  });

  it('should_prefill_autocomplete_values_with_active_filters', () => {
    renderDrawer({ typeFilter: 'Remota', roleFilter: 'Dev' });
    expect(screen.getByDisplayValue('Remota')).toBeTruthy();
    expect(screen.getByDisplayValue('Dev')).toBeTruthy();
  });

  it('should_clear_filters_and_close_when_limpar_clicked', () => {
    const { onClearFilters, onClose } = renderDrawer({ countSecondaryFilters: 2 });
    fireEvent.click(screen.getByRole('button', { name: 'LIMPAR' }));
    expect(onClearFilters).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
