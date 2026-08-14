// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// useDebounce real usa timers; no teste usamos o valor imediato para exercitar o effect.
vi.mock('use-debounce', () => ({
  useDebounce: (value: string) => [value, vi.fn()],
}));

import { useJobFilters } from '@/hooks/useJobFilters';

describe('useJobFilters', () => {
  const onFilterChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inicia_com_filtros_vazios_e_contadores_zero', () => {
    const { result } = renderHook(() => useJobFilters({ onFilterChange }));
    expect(result.current.platformFilter).toBe('');
    expect(result.current.roleFilter).toBe('');
    expect(result.current.searchFilter).toBe('');
    expect(result.current.companyFilter).toBe('');
    expect(result.current.typeFilter).toBe('');
    expect(result.current.countSecondaryFilters).toBe(0);
    expect(result.current.countTotalFilters).toBe(0);
  });

  it('handlePlatformChange_atualiza_estado_e_notifica', () => {
    onFilterChange.mockClear();
    const { result } = renderHook(() => useJobFilters({ onFilterChange }));
    onFilterChange.mockClear();

    act(() => {
      result.current.handlePlatformChange('react');
    });

    expect(result.current.platformFilter).toBe('react');
    expect(onFilterChange).toHaveBeenCalledWith({
      platform: 'react',
      role: undefined,
      search: undefined,
    });
    expect(result.current.countSecondaryFilters).toBe(1);
    expect(result.current.countTotalFilters).toBe(1);
  });

  it('handleRoleChange_atualiza_estado_e_notifica_mantendo_platform', () => {
    const { result } = renderHook(() => useJobFilters({ onFilterChange }));
    onFilterChange.mockClear();

    act(() => result.current.handlePlatformChange('react'));
    onFilterChange.mockClear();

    act(() => result.current.handleRoleChange('senior'));

    expect(result.current.roleFilter).toBe('senior');
    expect(onFilterChange).toHaveBeenCalledWith({
      platform: 'react',
      role: 'senior',
      search: undefined,
    });
  });

  it('handleSearch_envia_filtros_atuais_e_previne_default', () => {
    const { result } = renderHook(() => useJobFilters({ onFilterChange }));
    onFilterChange.mockClear();
    const preventDefault = vi.fn();

    act(() => {
      result.current.setSearchFilter('devops');
    });
    act(() => {
      result.current.handleSearch({ preventDefault } as unknown as React.FormEvent);
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onFilterChange).toHaveBeenLastCalledWith({
      platform: undefined,
      role: undefined,
      search: 'devops',
    });
  });

  it('debounce_do_search_dispara_onFilterChange', () => {
    const { result } = renderHook(() => useJobFilters({ onFilterChange }));
    onFilterChange.mockClear();

    act(() => {
      result.current.setSearchFilter('frontend');
    });

    expect(onFilterChange).toHaveBeenLastCalledWith({
      platform: undefined,
      role: undefined,
      search: 'frontend',
    });
  });

  it('handleClearFilters_reseta_tudo_e_notifica_vazio', () => {
    const { result } = renderHook(() => useJobFilters({ onFilterChange }));
    onFilterChange.mockClear();

    act(() => {
      result.current.handlePlatformChange('react');
      result.current.setCompanyFilter('Acme');
      result.current.setTypeFilter('remoto');
      result.current.setSearchFilter('dev');
    });
    expect(result.current.countSecondaryFilters).toBe(3);
    expect(result.current.countTotalFilters).toBe(4);

    onFilterChange.mockClear();
    act(() => {
      result.current.handleClearFilters();
    });

    expect(result.current.platformFilter).toBe('');
    expect(result.current.companyFilter).toBe('');
    expect(result.current.typeFilter).toBe('');
    expect(result.current.roleFilter).toBe('');
    expect(result.current.searchFilter).toBe('');
    expect(onFilterChange).toHaveBeenCalledWith({});
    expect(result.current.countSecondaryFilters).toBe(0);
    expect(result.current.countTotalFilters).toBe(0);
  });
});
