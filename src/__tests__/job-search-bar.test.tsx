// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobSearchBar } from '@/components/shared/job-search-bar';

const BASE = {
  variant: 'hero' as const,
  roleQueries: ['Python'],
  onRoleQueriesChange: vi.fn(),
};

describe('JobSearchBar', () => {
  it('should_render_hero_variant_with_tip', () => {
    render(<JobSearchBar {...BASE} />);
    expect(screen.getByText('BUSCAR VAGAS AGORA')).toBeTruthy();
    expect(screen.getByText(/DICA: Separe múltiplos termos/)).toBeTruthy();
  });

  it('should_render_header_variant_with_two_fields', () => {
    render(<JobSearchBar {...BASE} variant="header" onStart={vi.fn()} onCompaniesChange={vi.fn()} />);
    expect(screen.getByText('CARGOS / PALAVRAS-CHAVE')).toBeTruthy();
    expect(screen.getByText('EMPRESAS-ALVO')).toBeTruthy();
    expect(screen.getByText('BUSCAR VAGAS')).toBeTruthy();
  });

  it('should_disable_button_and_show_running_label', () => {
    render(<JobSearchBar {...BASE} variant="header" running onStart={vi.fn()} />);
    const button = screen.getByText('BUSCANDO...') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should_disable_button_during_cooldown', () => {
    const { container } = render(<JobSearchBar {...BASE} cooldown={30} />);
    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should_call_on_start_for_header_submit', () => {
    const onStart = vi.fn();
    const { container } = render(<JobSearchBar {...BASE} variant="header" onStart={onStart} />);
    fireEvent.submit(container.querySelector('form')!);
    expect(onStart).toHaveBeenCalled();
  });

  it('should_call_on_submit_for_hero_submit', () => {
    const onSubmit = vi.fn();
    const { container } = render(<JobSearchBar {...BASE} onSubmit={onSubmit} />);
    fireEvent.submit(container.querySelector('form')!);
    expect(onSubmit).toHaveBeenCalled();
  });

  it('should_add_role_via_suggestion_chip', () => {
    const onAddRole = vi.fn();
    render(<JobSearchBar {...BASE} suggestedRoles={['React']} onAddRole={onAddRole} />);
    fireEvent.click(screen.getByText('+ React'));
    expect(onAddRole).toHaveBeenCalledWith('React');
  });

  it('should_add_role_directly_when_no_callback', () => {
    const onChange = vi.fn();
    render(<JobSearchBar {...BASE} roleQueries={['Python']} onRoleQueriesChange={onChange} suggestedRoles={['React']} />);
    fireEvent.click(screen.getByText('+ React'));
    expect(onChange).toHaveBeenCalledWith(['Python', 'React']);
  });

  it('should_not_duplicate_role_already_selected', () => {
    const onChange = vi.fn();
    render(<JobSearchBar {...BASE} roleQueries={['Python']} onRoleQueriesChange={onChange} suggestedRoles={['Python']} />);
    fireEvent.click(screen.getByText('+ Python'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should_add_company_via_suggestion_chip', () => {
    const onAddCompany = vi.fn();
    render(<JobSearchBar {...BASE} suggestedCompanies={['iFood']} onAddCompany={onAddCompany} />);
    fireEvent.click(screen.getByText('+ iFood'));
    expect(onAddCompany).toHaveBeenCalledWith('iFood');
  });

  it('should_add_company_directly_when_no_callback', () => {
    const onCompaniesChange = vi.fn();
    render(
      <JobSearchBar {...BASE} companies={[]} onCompaniesChange={onCompaniesChange} suggestedCompanies={['iFood']} />,
    );
    fireEvent.click(screen.getByText('+ iFood'));
    expect(onCompaniesChange).toHaveBeenCalledWith(['iFood']);
  });
});